"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Check,
  History,
  Loader2,
  Plus,
  Settings as SettingsIcon,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Vessel } from "@/components/Vessel";
import { Field, Macro, Modal } from "@/components/ui";
import { api } from "@/lib/api";
import { downscale, type Downscaled } from "@/lib/image";
import { DAYS_SHORT, dayLabel, nowTime, todayKey, weekdayOf } from "@/lib/date";
import type { DayType, Entry, Settings, Template } from "@/lib/types";

const DEFAULT_SETTINGS: Settings = {
  target: null,
  restTarget: null,
  proteinTarget: null,
  trainingDays: [1, 3, 5, 0],
  overrides: {},
};

type Draft = {
  label: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  note: string;
};
const EMPTY_DRAFT: Draft = { label: "", kcal: "", protein: "", carbs: "", fat: "", note: "" };

export default function TodayPage() {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [todays, setTodays] = useState<Entry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // input state
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState<Downscaled | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estErr, setEstErr] = useState("");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showSettings, setShowSettings] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const tKey = todayKey();

  // load once
  useEffect(() => {
    (async () => {
      try {
        const [s, e, t] = await Promise.all([
          api.getSettings(),
          api.getEntriesForDate(tKey),
          api.getTemplates(),
        ]);
        setSettings(s);
        setTodays(e);
        setTemplates(t);
      } catch {
        /* surfaced via empty state */
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived
  const eaten = todays.reduce((a, e) => a + (e.kcal || 0), 0);
  const pSum = todays.reduce((a, e) => a + (e.protein || 0), 0);
  const cSum = todays.reduce((a, e) => a + (e.carbs || 0), 0);
  const fSum = todays.reduce((a, e) => a + (e.fat || 0), 0);

  const todayType: DayType =
    (settings.overrides[tKey] as DayType) ||
    (settings.trainingDays.includes(weekdayOf(tKey)) ? "training" : "rest");
  const targetFor = (type: DayType) =>
    type === "rest" ? settings.restTarget ?? settings.target : settings.target;
  const target = targetFor(todayType);
  const hasTarget = target != null && target > 0;
  const remaining = hasTarget ? (target as number) - eaten : null;
  const ratio = hasTarget ? eaten / (target as number) : 0;
  const over = hasTarget && eaten > (target as number) ? (eaten - (target as number)) / (target as number) : 0;

  // mutations
  function persistSettings(next: Settings) {
    setSettings(next);
    api.putSettings(next).catch(() => {});
  }

  async function addEntry(payload: Omit<Entry, "id" | "date" | "time">) {
    const optimistic: Entry = {
      id: `tmp-${Date.now()}`,
      date: tKey,
      time: nowTime(),
      ...payload,
    };
    setTodays((prev) => [...prev, optimistic]);
    try {
      const saved = await api.addEntry({ ...optimistic });
      setTodays((prev) => prev.map((e) => (e.id === optimistic.id ? saved : e)));
    } catch {
      setTodays((prev) => prev.filter((e) => e.id !== optimistic.id));
      setEstErr("Could not save that entry. Check your connection and try again.");
    }
  }

  async function deleteEntry(id: string) {
    const prev = todays;
    setTodays((cur) => cur.filter((e) => e.id !== id));
    try {
      await api.deleteEntry(id);
    } catch {
      setTodays(prev);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setEstErr("");
    try {
      const out = await downscale(file);
      setImg(out);
    } catch {
      setEstErr("That image would not load. Try another, or add the numbers manually.");
    }
    e.target.value = "";
  }

  async function runEstimate() {
    if (estimating) return;
    if (!desc.trim() && !img) return;
    setEstimating(true);
    setEstErr("");
    try {
      const r = await api.estimate({ imageBase64: img?.base64, mediaType: img?.mediaType, text: desc });
      setDraft({
        label: r.label,
        kcal: String(r.kcal),
        protein: String(r.protein),
        carbs: String(r.carbs),
        fat: String(r.fat),
        note: r.note,
      });
    } catch {
      setEstErr("Could not estimate that one. Add the numbers below and it will still log.");
    } finally {
      setEstimating(false);
    }
  }

  const kcalNum = Math.round(Number(draft.kcal) || 0);
  const canAdd = kcalNum > 0;

  function commitDraft() {
    if (!canAdd) return;
    addEntry({
      label: draft.label.trim() || desc.trim().slice(0, 40) || "Meal",
      kcal: kcalNum,
      protein: Math.round(Number(draft.protein) || 0),
      carbs: Math.round(Number(draft.carbs) || 0),
      fat: Math.round(Number(draft.fat) || 0),
      note: draft.note || "",
    });
    setDesc("");
    setImg(null);
    setEstErr("");
    setDraft(EMPTY_DRAFT);
  }

  async function saveDraftAsFavourite() {
    if (!canAdd) return;
    const name = draft.label.trim() || desc.trim().slice(0, 30) || "Saved meal";
    const payload = {
      name,
      kcal: kcalNum,
      protein: Math.round(Number(draft.protein) || 0),
      carbs: Math.round(Number(draft.carbs) || 0),
      fat: Math.round(Number(draft.fat) || 0),
    };
    try {
      const saved = await api.addTemplate(payload);
      setTemplates((prev) => [...prev, saved]);
    } catch {
      setEstErr("Could not save the favourite. Try again.");
    }
  }

  function addFromTemplate(t: Template) {
    addEntry({ label: t.name, kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat, note: "" });
  }

  async function deleteTemplate(id: string) {
    const prev = templates;
    setTemplates((cur) => cur.filter((t) => t.id !== id));
    try {
      await api.deleteTemplate(id);
    } catch {
      setTemplates(prev);
    }
  }

  function setDayType(type: DayType) {
    // Follow the Training Days schedule unless the chosen type differs from it,
    // in which case store a per-day override. Picking the type that matches the
    // schedule clears any override (back to "follows Training Days").
    const auto: DayType = settings.trainingDays.includes(weekdayOf(tKey)) ? "training" : "rest";
    const overrides = { ...settings.overrides };
    if (type === auto) delete overrides[tKey];
    else overrides[tKey] = type;
    persistSettings({ ...settings, overrides });
  }

  function toggleTrainingDay(d: number) {
    const set = settings.trainingDays.includes(d)
      ? settings.trainingDays.filter((x) => x !== d)
      : [...settings.trainingDays, d];
    persistSettings({ ...settings, trainingDays: set });
  }

  function setNum(field: "target" | "restTarget" | "proteinTarget", raw: string) {
    const v = raw === "" ? null : Math.max(0, Math.round(Number(raw) || 0));
    persistSettings({ ...settings, [field]: v });
  }

  if (!loaded) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
          color: "var(--muted)",
        }}
      >
        <Loader2 size={18} className="cal-spin" />
      </div>
    );
  }

  return (
    <>
      {/* header */}
      <header className="cal-head">
        <div className="cal-brand">
          <span className="cal-mark" />
          <span>Daily intake</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Link className="cal-icon" href="/history" aria-label="History">
            <History size={17} />
          </Link>
          <button className="cal-icon" onClick={() => setShowSettings(true)} aria-label="Settings">
            <SettingsIcon size={17} />
          </button>
        </div>
      </header>

      {/* day-type toggle */}
      <div className="cal-daytoggle" role="group" aria-label="Day type">
        {(["training", "rest"] as const).map((t) => (
          <button
            key={t}
            className={`cal-dtb ${todayType === t ? "on" : ""}`}
            onClick={() => setDayType(t)}
            aria-pressed={todayType === t}
          >
            {t === "training" ? "Training day" : "Rest day"}
          </button>
        ))}
      </div>

      {/* hero */}
      <section className="cal-card cal-hero">
        <Vessel ratio={ratio} over={over} />
        <div className="cal-hero-r">
          <div className="cal-eyebrow">
            {dayLabel(tKey)} · {todayType === "training" ? "training day" : "rest day"}
          </div>
          {hasTarget && remaining != null ? (
            <>
              <div className={`cal-big ${remaining < 0 ? "cal-over" : ""}`}>{Math.abs(remaining)}</div>
              <div className="cal-big-sub">{remaining < 0 ? "kcal over target" : "kcal left"}</div>
              <div className="cal-meter">
                <span>{eaten}</span>
                <span className="cal-dim"> of {target} eaten</span>
              </div>
            </>
          ) : (
            <>
              <div className="cal-big cal-dim" style={{ fontSize: 26, lineHeight: 1.15 }}>
                Set your
                <br />
                target
              </div>
              <button
                className="cal-btn cal-btn-pri"
                style={{ marginTop: 12 }}
                onClick={() => setShowSettings(true)}
              >
                Open settings
              </button>
            </>
          )}
          <div className="cal-macros">
            <Macro label="Protein" val={pSum} target={settings.proteinTarget} />
            <Macro label="Carbs" val={cSum} />
            <Macro label="Fat" val={fSum} />
          </div>
        </div>
      </section>

      {/* quick add */}
      {templates.length > 0 && (
        <div className="cal-chips">
          {templates.map((t) => (
            <button key={t.id} className="cal-chip" onClick={() => addFromTemplate(t)}>
              <Plus size={13} /> {t.name} <span className="cal-chip-k">{t.kcal}</span>
            </button>
          ))}
        </div>
      )}

      {/* add food */}
      <section className="cal-card">
        <div className="cal-eyebrow" style={{ marginBottom: 10 }}>
          Add a meal
        </div>

        <textarea
          className="cal-input cal-area"
          placeholder="What did you eat? e.g. 150g grilled chicken, cup of rice, handful of edamame"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
        />

        {img && (
          <div className="cal-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.preview} alt="meal" />
            <button className="cal-thumb-x" onClick={() => setImg(null)} aria-label="Remove photo">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="cal-row">
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{ display: "none" }} />
          <button className="cal-btn cal-btn-sec" onClick={() => fileRef.current?.click()}>
            <Camera size={16} /> {img ? "Change photo" : "Add photo"}
          </button>
          <button
            className="cal-btn cal-btn-sec"
            onClick={runEstimate}
            disabled={estimating || (!desc.trim() && !img)}
          >
            {estimating ? (
              <>
                <Loader2 size={16} className="cal-spin" /> Estimating
              </>
            ) : (
              <>Estimate macros</>
            )}
          </button>
        </div>

        {estErr && <div className="cal-err">{estErr}</div>}

        {/* editable entry */}
        <div className="cal-entry">
          <input
            className="cal-input"
            placeholder="Name (optional)"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
          <div className="cal-fields">
            <Field label="kcal" value={draft.kcal} onChange={(v) => setDraft({ ...draft, kcal: v })} accent />
            <Field label="Protein" value={draft.protein} onChange={(v) => setDraft({ ...draft, protein: v })} />
            <Field label="Carbs" value={draft.carbs} onChange={(v) => setDraft({ ...draft, carbs: v })} />
            <Field label="Fat" value={draft.fat} onChange={(v) => setDraft({ ...draft, fat: v })} />
          </div>
          {draft.note && <div className="cal-note">{draft.note}</div>}
          <div className="cal-row">
            <button className="cal-btn cal-btn-pri" onClick={commitDraft} disabled={!canAdd}>
              <Check size={16} /> Add to today
            </button>
            <button
              className="cal-btn cal-btn-ghost"
              onClick={saveDraftAsFavourite}
              disabled={!canAdd}
              title="Save for one-tap logging"
            >
              <Star size={15} /> Save as favourite
            </button>
          </div>
        </div>
      </section>

      {/* today list */}
      <section className="cal-card">
        <div className="cal-eyebrow" style={{ marginBottom: 8 }}>
          Today · {todays.length} {todays.length === 1 ? "item" : "items"}
        </div>
        {todays.length === 0 ? (
          <div className="cal-empty">Nothing logged yet. Add your first meal above.</div>
        ) : (
          <ul className="cal-list">
            {todays.map((e) => (
              <li key={e.id} className="cal-li">
                <div className="cal-li-time">{e.time}</div>
                <div className="cal-li-main">
                  <div className="cal-li-name">{e.label}</div>
                  {e.protein > 0 && (
                    <div className="cal-li-meta">
                      P {e.protein} · C {e.carbs} · F {e.fat}
                    </div>
                  )}
                </div>
                <div className="cal-li-k">{e.kcal}</div>
                <button className="cal-li-del" onClick={() => deleteEntry(e.id)} aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* footer */}
      <div className="cal-foot">
        <Link className="cal-btn cal-btn-ghost" href="/history">
          <History size={15} /> History &amp; export
        </Link>
        <span className="cal-foot-note">
          Saved automatically · estimates are approximate, edit before logging
        </span>
      </div>

      {/* settings drawer */}
      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div className="cal-eyebrow" style={{ marginBottom: 8 }}>
            Daily targets (kcal)
          </div>
          <div className="cal-srow">
            <label>Training day</label>
            <input
              className="cal-sinput"
              inputMode="numeric"
              value={settings.target ?? ""}
              onChange={(e) => setNum("target", e.target.value)}
              placeholder="—"
            />
          </div>
          <div className="cal-srow">
            <label>Rest day</label>
            <input
              className="cal-sinput"
              inputMode="numeric"
              value={settings.restTarget ?? ""}
              onChange={(e) => setNum("restTarget", e.target.value)}
              placeholder="same as training"
            />
          </div>
          <div className="cal-srow">
            <label>Protein goal (g)</label>
            <input
              className="cal-sinput"
              inputMode="numeric"
              value={settings.proteinTarget ?? ""}
              onChange={(e) => setNum("proteinTarget", e.target.value)}
              placeholder="optional"
            />
          </div>

          <div className="cal-eyebrow" style={{ margin: "18px 0 8px" }}>
            Training days
          </div>
          <div className="cal-weekdays">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button
                key={d}
                className={`cal-wd ${settings.trainingDays.includes(d) ? "on" : ""}`}
                onClick={() => toggleTrainingDay(d)}
              >
                {DAYS_SHORT[d][0]}
              </button>
            ))}
          </div>

          {templates.length > 0 && (
            <>
              <div className="cal-eyebrow" style={{ margin: "18px 0 8px" }}>
                Favourites
              </div>
              <ul className="cal-list">
                {templates.map((t) => (
                  <li key={t.id} className="cal-li">
                    <div className="cal-li-main">
                      <div className="cal-li-name">{t.name}</div>
                      <div className="cal-li-meta">
                        P {t.protein} · C {t.carbs} · F {t.fat}
                      </div>
                    </div>
                    <div className="cal-li-k">{t.kcal}</div>
                    <button
                      className="cal-li-del"
                      onClick={() => deleteTemplate(t.id)}
                      aria-label="Delete favourite"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
