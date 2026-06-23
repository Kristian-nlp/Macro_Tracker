"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Barcode,
  Camera,
  Check,
  History,
  Languages,
  Loader2,
  Plus,
  Settings as SettingsIcon,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Vessel } from "@/components/Vessel";
import { Field, Macro, Modal } from "@/components/ui";
import { useLang } from "@/components/LangProvider";
import { api } from "@/lib/api";
import { downscale, type Downscaled } from "@/lib/image";
import { dayLabel, nowTime, todayKey, weekdayOf } from "@/lib/date";
import { DAYS_SHORT } from "@/lib/i18n";
import type { DayType, Entry, Settings, Template } from "@/lib/types";

// Camera scanner is browser-only and pulls in ZXing, so load it lazily.
const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), { ssr: false });

type Macros = { kcal: number; protein: number; carbs: number; fat: number };

const DEFAULT_SETTINGS: Settings = {
  target: null,
  trainingProtein: null,
  trainingCarbs: null,
  trainingFat: null,
  restTarget: null,
  restProtein: null,
  restCarbs: null,
  restFat: null,
  trainingDays: [1, 3, 5, 0],
  overrides: {},
};

// Numeric settings fields editable in the Settings drawer.
type NumField =
  | "target"
  | "trainingProtein"
  | "trainingCarbs"
  | "trainingFat"
  | "restTarget"
  | "restProtein"
  | "restCarbs"
  | "restFat";

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
  const { t, lang, setLang } = useLang();
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
  const [showUser, setShowUser] = useState(false);
  const [username, setUsername] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // barcode scanning
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<{ name: string; per100g: Macros } | null>(null);
  const [amount, setAmount] = useState("");

  const tKey = todayKey();

  // load once
  useEffect(() => {
    (async () => {
      try {
        const [me, s, e, t] = await Promise.all([
          api.getMe(),
          api.getSettings(),
          api.getEntriesForDate(tKey),
          api.getTemplates(),
        ]);
        setUsername(me.username);
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

  // Active macro targets follow the day type.
  const macroTargets =
    todayType === "rest"
      ? { protein: settings.restProtein, carbs: settings.restCarbs, fat: settings.restFat }
      : { protein: settings.trainingProtein, carbs: settings.trainingCarbs, fat: settings.trainingFat };

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
      setEstErr(t("errSave"));
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
      setEstErr(t("errImage"));
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
      setEstErr(t("errEstimate"));
    } finally {
      setEstimating(false);
    }
  }

  // Fill the editable draft from a scanned product's per-100g macros, scaled to
  // the entered amount in grams.
  function applyAmount(name: string, per100g: Macros, grams: number) {
    const f = (grams || 0) / 100;
    setDraft({
      label: name,
      kcal: String(Math.round(per100g.kcal * f)),
      protein: String(Math.round(per100g.protein * f)),
      carbs: String(Math.round(per100g.carbs * f)),
      fat: String(Math.round(per100g.fat * f)),
      note: `${grams || 0} g · ${name}`,
    });
  }

  async function onBarcode(code: string) {
    setScanning(false);
    setEstErr("");
    try {
      const r = await fetch(`/api/product/${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = await r.json();
      if (!data?.found) {
        setEstErr(t("errBarcodeNotFound"));
        return;
      }
      const grams: number = data.servingGrams ?? 100;
      setScanned({ name: data.name, per100g: data.per100g });
      setAmount(String(grams));
      applyAmount(data.name, data.per100g, grams);
    } catch {
      setEstErr(t("errBarcodeLookup"));
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
    setScanned(null);
    setAmount("");
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
      setEstErr(t("errFav"));
    }
  }

  function addFromTemplate(t: Template) {
    addEntry({ label: t.name, kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat, note: "" });
  }

  async function switchUser() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
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

  function setNum(field: NumField, raw: string) {
    const v = raw === "" ? null : Math.max(0, Math.round(Number(raw) || 0));
    persistSettings({ ...settings, [field]: v });
  }

  const targetRow = (label: string, field: NumField, placeholder = t("optional")) => (
    <div className="cal-srow" key={field}>
      <label>{label}</label>
      <input
        className="cal-sinput"
        inputMode="numeric"
        value={settings[field] ?? ""}
        onChange={(e) => setNum(field, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

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
          <span>{t("brand")}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="cal-icon cal-lang"
            onClick={() => setLang(lang === "en" ? "de" : "en")}
            aria-label={t("aLanguage")}
            title={t("aLanguage")}
          >
            <Languages size={15} />
            <span>{lang.toUpperCase()}</span>
          </button>
          <Link className="cal-icon" href="/history" aria-label={t("aHistory")}>
            <History size={17} />
          </Link>
          <button className="cal-icon" onClick={() => setShowSettings(true)} aria-label={t("aSettings")}>
            <SettingsIcon size={17} />
          </button>
          <button className="cal-icon" onClick={() => setShowUser(true)} aria-label={t("aAccount")}>
            <User size={17} />
          </button>
        </div>
      </header>

      {/* hero */}
      <section className="cal-card cal-hero">
        <Vessel ratio={ratio} over={over} />
        <div className="cal-hero-r">
          <div className="cal-hero-top">
            <div className="cal-eyebrow">{dayLabel(tKey, lang)}</div>
            <button
              className={`cal-switch ${todayType === "training" ? "is-training" : "is-rest"}`}
              onClick={() => setDayType(todayType === "training" ? "rest" : "training")}
              role="switch"
              aria-checked={todayType === "training"}
              aria-label={`${t("training")} / ${t("rest")}`}
            >
              <span className="cal-switch-opt rest">{t("rest")}</span>
              <span className="cal-switch-opt training">{t("training")}</span>
              <span className="cal-switch-knob" />
            </button>
          </div>

          {hasTarget && remaining != null ? (
            <>
              <div className={`cal-big ${remaining < 0 ? "cal-over" : ""}`}>{Math.abs(remaining)}</div>
              <div className="cal-big-sub">{remaining < 0 ? t("kcalOver") : t("kcalLeft")}</div>
              <div className="cal-meter">
                <span>{eaten}</span>
                <span className="cal-dim"> {t("ofEaten", { target: target as number })}</span>
              </div>
            </>
          ) : (
            <>
              <div className="cal-big">{eaten}</div>
              <div className="cal-big-sub">{t("kcalEatenHint")}</div>
            </>
          )}

          <div className="cal-hero-bottom">
            <div className="cal-macros">
              <Macro label={t("protein")} val={pSum} target={macroTargets.protein} />
              <Macro label={t("carbs")} val={cSum} target={macroTargets.carbs} />
              <Macro label={t("fat")} val={fSum} target={macroTargets.fat} />
            </div>
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
          {t("addMeal")}
        </div>

        <textarea
          className="cal-input cal-area"
          placeholder={t("descPlaceholder")}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
        />

        {img && (
          <div className="cal-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.preview} alt="meal" />
            <button className="cal-thumb-x" onClick={() => setImg(null)} aria-label="×">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="cal-row">
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{ display: "none" }} />
          <button
            className="cal-btn cal-btn-sec"
            onClick={runEstimate}
            disabled={estimating || (!desc.trim() && !img)}
          >
            {estimating ? (
              <>
                <Loader2 size={16} className="cal-spin" /> {t("estimating")}
              </>
            ) : (
              <>{t("estimate")}</>
            )}
          </button>
          <button className="cal-btn cal-btn-sec" onClick={() => fileRef.current?.click()}>
            <Camera size={16} /> {img ? t("changePhoto") : t("addPhoto")}
          </button>
          <button
            className="cal-btn cal-btn-sec"
            onClick={() => {
              setEstErr("");
              setScanning(true);
            }}
          >
            <Barcode size={16} /> {t("barcode")}
          </button>
        </div>

        {estErr && <div className="cal-err">{estErr}</div>}

        {/* editable entry */}
        <div className="cal-entry">
          {scanned && (
            <div className="cal-scanned">
              <span className="cal-scanned-name">{scanned.name}</span>
              <label className="cal-scanned-amt">
                <input
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    applyAmount(
                      scanned.name,
                      scanned.per100g,
                      Math.max(0, Math.round(Number(e.target.value) || 0)),
                    );
                  }}
                />
                <span>g</span>
              </label>
            </div>
          )}
          <input
            className="cal-input"
            placeholder={t("namePlaceholder")}
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
          <div className="cal-fields">
            <Field label={t("fKcal")} value={draft.kcal} onChange={(v) => setDraft({ ...draft, kcal: v })} accent />
            <Field label={t("fProtein")} value={draft.protein} onChange={(v) => setDraft({ ...draft, protein: v })} />
            <Field label={t("fCarbs")} value={draft.carbs} onChange={(v) => setDraft({ ...draft, carbs: v })} />
            <Field label={t("fFat")} value={draft.fat} onChange={(v) => setDraft({ ...draft, fat: v })} />
          </div>
          {draft.note && <div className="cal-note">{draft.note}</div>}
          <div className="cal-row">
            <button className="cal-btn cal-btn-pri" onClick={commitDraft} disabled={!canAdd}>
              <Check size={16} /> {t("addToToday")}
            </button>
            <button
              className="cal-btn cal-btn-ghost"
              onClick={saveDraftAsFavourite}
              disabled={!canAdd}
              title={t("saveFavTitle")}
            >
              <Star size={15} /> {t("saveFav")}
            </button>
          </div>
        </div>
      </section>

      {/* today list */}
      <section className="cal-card">
        <div className="cal-eyebrow" style={{ marginBottom: 8 }}>
          {todays.length === 1
            ? t("todayItemOne", { n: todays.length })
            : t("todayItemMany", { n: todays.length })}
        </div>
        {todays.length === 0 ? (
          <div className="cal-empty">{t("nothingLogged")}</div>
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
                <button className="cal-li-del" onClick={() => deleteEntry(e.id)} aria-label="×">
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
          <History size={15} /> {t("historyExport")}
        </Link>
        <span className="cal-foot-note">{t("footNote")}</span>
      </div>

      {/* barcode scanner */}
      {scanning && <BarcodeScanner onDetected={onBarcode} onClose={() => setScanning(false)} />}

      {/* account */}
      {showUser && (
        <Modal title={t("accountTitle")} onClose={() => setShowUser(false)}>
          <div className="cal-srow">
            <label>{t("signedInAs")}</label>
            <span className="cal-user">{username || "—"}</span>
          </div>
          <div className="cal-row" style={{ marginTop: 12 }}>
            <button className="cal-btn cal-btn-sec" onClick={switchUser}>
              {t("switchUser")}
            </button>
          </div>
        </Modal>
      )}

      {/* settings drawer */}
      {showSettings && (
        <Modal title={t("settingsTitle")} onClose={() => setShowSettings(false)}>
          <div className="cal-eyebrow" style={{ marginBottom: 8 }}>
            {t("trainingTargets")}
          </div>
          {targetRow(t("calories"), "target", "—")}
          {targetRow(t("proteinG"), "trainingProtein")}
          {targetRow(t("carbsG"), "trainingCarbs")}
          {targetRow(t("fatG"), "trainingFat")}

          <div className="cal-eyebrow" style={{ margin: "18px 0 8px" }}>
            {t("restTargets")}
          </div>
          {targetRow(t("calories"), "restTarget", t("sameAsTraining"))}
          {targetRow(t("proteinG"), "restProtein")}
          {targetRow(t("carbsG"), "restCarbs")}
          {targetRow(t("fatG"), "restFat")}

          <div className="cal-eyebrow" style={{ margin: "18px 0 8px" }}>
            {t("trainingDays")}
          </div>
          <div className="cal-weekdays">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button
                key={d}
                className={`cal-wd ${settings.trainingDays.includes(d) ? "on" : ""}`}
                onClick={() => toggleTrainingDay(d)}
              >
                {lang === "de" ? DAYS_SHORT.de[d] : DAYS_SHORT.en[d][0]}
              </button>
            ))}
          </div>

          {templates.length > 0 && (
            <>
              <div className="cal-eyebrow" style={{ margin: "18px 0 8px" }}>
                {t("favourites")}
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
                    <button className="cal-li-del" onClick={() => deleteTemplate(t.id)} aria-label="×">
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
