"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Camera, Check, Loader2, Pencil, X } from "lucide-react";
import { DotGrid } from "@/components/DotGrid";
import { MacroMarker, MacroShape } from "@/components/MacroMarker";
import { MealRow } from "@/components/MealRow";
import { BottomNav } from "@/components/BottomNav";
import { useLang } from "@/components/LangProvider";
import { api } from "@/lib/api";
import { downscale, type Downscaled } from "@/lib/image";
import { dateLong, nowTime, slotKey, todayKey, weekdayLongUpper, weekdayOf } from "@/lib/date";
import { dominantMacro, MACRO, type MacroKey } from "@/lib/macros";
import type { DayType, Entry, EstimateResult, Settings, Template } from "@/lib/types";

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

const PORTIONS = [0.5, 1, 1.5, 2] as const;
const PORTION_LABELS = ["½", "1", "1½", "2"];
const PILL_TEXT: Record<MacroKey, string> = { protein: "#41503A", carbs: "#8A4A2C", fat: "#8A6A24" };

// A Today macro card: marker + name, current/target (mono), thin progress bar.
function MacroCard({ macro, name, val, tgt }: { macro: MacroKey; name: string; val: number; tgt: number | null | undefined }) {
  const pct = tgt && tgt > 0 ? Math.min(1, val / tgt) * 100 : 0;
  return (
    <div style={{ flex: 1, background: "#FCFAF4", border: "1px solid #E8E4D6", borderRadius: 16, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <MacroShape macro={macro} size={8} />
        <span className="g-overline" style={{ fontSize: 10, letterSpacing: ".08em" }}>{name}</span>
      </div>
      <div style={{ marginTop: 9 }}>
        <span className="g-fm" style={{ fontSize: 18, color: "#1B1D17" }}>{val}</span>
        <span style={{ fontSize: 11, color: "#9A9C8F" }}>{tgt ? `/${tgt}` : ""}</span>
      </div>
      <div className="g-mbar">
        <span style={{ width: `${pct}%`, background: MACRO[macro].accent }} />
      </div>
    </div>
  );
}

export default function TodayPage() {
  const { t, lang } = useLang();
  const fmt = (n: number) => n.toLocaleString(lang === "de" ? "de-DE" : "en-US");

  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [todays, setTodays] = useState<Entry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // logging flow
  const [sheet, setSheet] = useState<null | "add" | "review">(null);
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState<Downscaled | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estErr, setEstErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // barcode
  const [scanning, setScanning] = useState(false);

  // review
  const [est, setEst] = useState<EstimateResult | null>(null);
  const [label, setLabel] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [portion, setPortion] = useState(1);
  const [adj, setAdj] = useState({ protein: 0, carbs: 0, fat: 0 });

  const tKey = todayKey();

  useEffect(() => {
    (async () => {
      try {
        const [, s, e, tpl] = await Promise.all([
          api.getMe(), // auth guard: 401 here redirects to /login
          api.getSettings(),
          api.getEntriesForDate(tKey),
          api.getTemplates(),
        ]);
        setSettings(s);
        setTodays(e);
        setTemplates(tpl);
      } catch {
        /* surfaced via empty state */
      }
      setLoaded(true);
    })();
    // open the Add sheet when arriving from the bottom-nav `+` on another tab
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("add") === "1") {
      setSheet("add");
      window.history.replaceState(null, "", "/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived totals
  const eaten = todays.reduce((a, e) => a + (e.kcal || 0), 0);
  const pSum = todays.reduce((a, e) => a + (e.protein || 0), 0);
  const cSum = todays.reduce((a, e) => a + (e.carbs || 0), 0);
  const fSum = todays.reduce((a, e) => a + (e.fat || 0), 0);

  const todayType: DayType =
    (settings.overrides[tKey] as DayType) ||
    (settings.trainingDays.includes(weekdayOf(tKey)) ? "training" : "rest");
  const target = (todayType === "rest" ? settings.restTarget ?? settings.target : settings.target) ?? 0;
  const hasTarget = target > 0;
  const remaining = target - eaten;
  const over = hasTarget && eaten > target;

  const macroTargets =
    todayType === "rest"
      ? { protein: settings.restProtein, carbs: settings.restCarbs, fat: settings.restFat }
      : { protein: settings.trainingProtein, carbs: settings.trainingCarbs, fat: settings.trainingFat };

  // ---- mutations ----
  function persistSettings(next: Settings) {
    setSettings(next);
    api.putSettings(next).catch(() => {});
  }

  function setDayType(type: DayType) {
    const auto: DayType = settings.trainingDays.includes(weekdayOf(tKey)) ? "training" : "rest";
    const overrides = { ...settings.overrides };
    if (type === auto) delete overrides[tKey];
    else overrides[tKey] = type;
    persistSettings({ ...settings, overrides });
  }

  async function addEntry(payload: Omit<Entry, "id" | "date" | "time">) {
    const optimistic: Entry = { id: `tmp-${Date.now()}`, date: tKey, time: nowTime(), ...payload };
    setTodays((prev) => [...prev, optimistic]);
    try {
      const saved = await api.addEntry({ ...optimistic });
      setTodays((prev) => prev.map((e) => (e.id === optimistic.id ? saved : e)));
    } catch {
      setTodays((prev) => prev.filter((e) => e.id !== optimistic.id));
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
      if (sheet !== "add") setSheet("add");
    } catch {
      setEstErr(t("errImage"));
    }
    e.target.value = "";
  }

  async function runEstimate() {
    if (estimating || (!desc.trim() && !img)) return;
    setEstimating(true);
    setEstErr("");
    try {
      const r = await api.estimate({ imageBase64: img?.base64, mediaType: img?.mediaType, text: desc });
      openReview(r);
    } catch {
      setEstErr(t("errEstimate"));
    } finally {
      setEstimating(false);
    }
  }

  async function onBarcode(code: string) {
    setScanning(false);
    setEstErr("");
    try {
      const r = await fetch(`/api/product/${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = await r.json();
      if (!data?.found) {
        if (sheet !== "add") setSheet("add"); // make the error visible
        setEstErr(t("errBarcodeNotFound"));
        return;
      }
      const grams: number = data.servingGrams ?? 100;
      const per100g: Macros = data.per100g;
      const f = grams / 100;
      openReview({
        label: data.name,
        kcal: Math.round(per100g.kcal * f),
        protein: Math.round(per100g.protein * f),
        carbs: Math.round(per100g.carbs * f),
        fat: Math.round(per100g.fat * f),
        note: `${grams} g · ${data.name}`,
      });
    } catch {
      if (sheet !== "add") setSheet("add"); // make the error visible
      setEstErr(t("errBarcodeLookup"));
    }
  }

  function openReview(r: EstimateResult) {
    setEst(r);
    setLabel(r.label);
    setPortion(1);
    setAdj({ protein: 0, carbs: 0, fat: 0 });
    setEditingName(false);
    setSheet("review");
  }

  // review derived values
  const rv = (k: "kcal" | "protein" | "carbs" | "fat") => {
    if (!est) return 0;
    const base = Math.round(est[k] * portion);
    return k === "kcal" ? base : Math.max(0, base + adj[k]);
  };
  const rKcal = rv("kcal");
  const rP = rv("protein");
  const rC = rv("carbs");
  const rF = rv("fat");
  const rDom = dominantMacro(rP, rC, rF);

  function stepMacro(k: "protein" | "carbs" | "fat", d: number) {
    setAdj((a) => ({ ...a, [k]: a[k] + d }));
  }

  function commitReview() {
    if (rKcal <= 0) return;
    addEntry({
      label: label.trim() || est?.label || t("addMeal"),
      kcal: rKcal,
      protein: rP,
      carbs: rC,
      fat: rF,
      note: est?.note || "",
    });
    resetFlow();
  }

  async function saveReviewFavourite() {
    if (rKcal <= 0) return;
    try {
      const saved = await api.addTemplate({
        name: label.trim() || est?.label || t("addMeal"),
        kcal: rKcal,
        protein: rP,
        carbs: rC,
        fat: rF,
      });
      setTemplates((prev) => [...prev, saved]);
    } catch {
      /* non-fatal */
    }
  }

  function addFromTemplate(tpl: Template) {
    addEntry({ label: tpl.name, kcal: tpl.kcal, protein: tpl.protein, carbs: tpl.carbs, fat: tpl.fat, note: "" });
    resetFlow();
  }

  function resetFlow() {
    setSheet(null);
    setDesc("");
    setImg(null);
    setEst(null);
    setLabel("");
    setEstErr("");
    setEditingName(false);
  }

  const mostlyKey = (p: number, c: number, f: number) =>
    ({ protein: "mostlyProtein", carbs: "mostlyCarbs", fat: "mostlyFat" } as const)[dominantMacro(p, c, f)];

  const overline = (text: string, style?: React.CSSProperties) => (
    <div className="g-overline" style={style}>
      {text}
    </div>
  );

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 240, color: "var(--muted)" }}>
        <Loader2 size={18} className="g-spin" />
      </div>
    );
  }

  return (
    <div className="g-screen">
      <div className="g-scroll" style={{ paddingBottom: 156 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 28px 0" }}>
          <div>
            {overline(weekdayLongUpper(tKey, lang))}
            <div className="g-fg" style={{ fontWeight: 700, fontSize: 23, color: "#1B1D17", letterSpacing: "-.01em", marginTop: 2 }}>
              {dateLong(tKey, lang)}
            </div>
          </div>
          <div className="g-daytype" role="group" aria-label={`${t("training")} / ${t("rest")}`}>
            <button className={todayType === "training" ? "is-on" : ""} onClick={() => setDayType("training")}>{t("training")}</button>
            <button className={todayType === "rest" ? "is-on" : ""} onClick={() => setDayType("rest")}>{t("rest")}</button>
          </div>
        </div>

        {/* hero card */}
        <div style={{ margin: "18px 28px 0", background: "#FCFAF4", border: "1px solid #E8E4D6", borderRadius: 24, padding: "22px 22px 20px" }}>
          {overline(hasTarget ? t("calsLeft") : t("eatenLabel"))}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 8 }}>
            <span className="g-fg" style={{ fontWeight: 700, fontSize: 54, lineHeight: 0.9, letterSpacing: "-.03em", color: over ? "#BC6440" : "#1B1D17" }}>
              {hasTarget ? fmt(Math.abs(remaining)) : fmt(eaten)}
            </span>
            <span style={{ fontSize: 14, color: "#7A7E6F", marginBottom: 6 }}>
              {hasTarget ? (over ? t("kcalOverBudget") : t("ofTargetKcal", { target: fmt(target) })) : t("noTargetEatenHint")}
            </span>
          </div>
          <DotGrid consumed={eaten} target={hasTarget ? target : 0} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 11.5, color: "#9A9C8F" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#55654C" }} />
              {fmt(eaten)} {t("eatenLabel")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#DCE0D2" }} />
              {fmt(hasTarget && remaining > 0 ? remaining : 0)} {t("leftLabel")}
            </span>
          </div>
        </div>

        {/* macro cards */}
        <div style={{ display: "flex", gap: 10, margin: "14px 28px 0" }}>
          <MacroCard macro="protein" name={t("protein")} val={pSum} tgt={macroTargets.protein} />
          <MacroCard macro="carbs" name={t("carbs")} val={cSum} tgt={macroTargets.carbs} />
          <MacroCard macro="fat" name={t("fat")} val={fSum} tgt={macroTargets.fat} />
        </div>

        {/* today list */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "20px 28px 0" }}>
          <span className="g-fg" style={{ fontWeight: 600, fontSize: 17, color: "#1B1D17" }}>
            {t("backToday")}
          </span>
          <span className="g-fm" style={{ fontSize: 12, color: "#9A9C8F" }}>
            {todays.length === 1 ? t("mealsOne", { n: todays.length }) : t("mealsMany", { n: todays.length })}
          </span>
        </div>
        <div style={{ margin: "4px 28px 0" }}>
          {todays.length === 0 ? (
            <div style={{ fontSize: 14, color: "#9A9C8F", padding: "16px 0" }}>{t("nothingLogged")}</div>
          ) : (
            todays.map((e) => (
              <MealRow
                key={e.id}
                title={e.label}
                meta={`${t(slotKey(e.time))} · ${e.time}`}
                kcal={e.kcal}
                protein={e.protein}
                carbs={e.carbs}
                fat={e.fat}
                onDelete={() => deleteEntry(e.id)}
                deleteLabel={t("aDelete")}
              />
            ))
          )}
        </div>
      </div>

      {/* fixed footer: quick-add + bottom nav */}
      <div className="g-footer">
        <div className="g-quick">
          <button className="g-quick-field" onClick={() => setSheet("add")}>
            <span style={{ width: 30, height: 30, flex: "none", borderRadius: 9, background: "#E7EADF", display: "grid", placeItems: "center" }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#55654C" strokeWidth="2" strokeLinecap="round">
                <path d="M8 3v10M3 8h10" />
              </svg>
            </span>
            <span style={{ color: "#9C9E90", fontSize: 14 }}>{t("describeMeal")}</span>
          </button>
          <button className="g-quick-ico" onClick={() => fileRef.current?.click()} aria-label={t("addPhoto")}>
            <Camera size={21} />
          </button>
          <button className="g-quick-ico" onClick={() => { setEstErr(""); setScanning(true); }} aria-label={t("barcode")}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="#55654C">
              <rect x="4" y="6" width="1.6" height="12" /><rect x="7.4" y="6" width="1" height="12" />
              <rect x="9.8" y="6" width="2.2" height="12" /><rect x="13.4" y="6" width="1" height="12" />
              <rect x="15.4" y="6" width="1.8" height="12" /><rect x="18.6" y="6" width="1.2" height="12" />
            </svg>
          </button>
        </div>
        <BottomNav active="today" onAdd={() => setSheet("add")} labels={{ today: t("backToday"), history: t("historyTitle"), settings: t("settingsTitle"), add: t("addMeal") }} />
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{ display: "none" }} />

      {scanning && <BarcodeScanner onDetected={onBarcode} onClose={() => setScanning(false)} />}

      {/* ---------- Add a meal sheet ---------- */}
      {sheet === "add" && (
        <div className="g-sheet-bg" onClick={resetFlow}>
          <div className="g-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="g-sheet-grab"><span /></div>
            <div className="g-sheet-head">
              <span className="g-sheet-title">{t("addMeal")}</span>
              <button className="g-sheet-x" onClick={resetFlow} aria-label="×"><X size={16} /></button>
            </div>
            <div className="g-sheet-body" style={{ paddingBottom: 26 }}>
              {/* capture card */}
              <div style={{ background: "#FCFAF4", border: "1px solid #E4E0D2", borderRadius: 18, padding: 16, marginTop: 8 }}>
                {overline(t("snapDescribe"))}
                <div style={{ display: "flex", gap: 10, marginTop: 13 }}>
                  {img && (
                    <div style={{ position: "relative", width: 64, height: 64, flex: "none", borderRadius: 14, overflow: "hidden", border: "1px solid #DBD7C9" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.preview} alt="meal" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <button
                        onClick={() => setImg(null)}
                        aria-label="×"
                        style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: "#1B1D17", border: "none", display: "grid", placeItems: "center" }}
                      >
                        <X size={9} color="#fff" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{ width: 64, height: 64, flex: "none", borderRadius: 14, border: "1.5px dashed #C9C5B5", background: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: "#7E826F" }}
                  >
                    <Camera size={20} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#8A8D7E" }}>{t("addPhotoShort")}</span>
                  </button>
                </div>
                <textarea
                  className="g-input"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={t("descPlaceholder")}
                  rows={2}
                  style={{ border: "none", borderTop: "1px solid #EBE7D9", borderRadius: 0, marginTop: 14, paddingTop: 14, paddingLeft: 0, paddingRight: 0, fontSize: 16 }}
                />
                <button className="g-btn g-btn-pri g-btn-block" onClick={runEstimate} disabled={estimating || (!desc.trim() && !img)} style={{ marginTop: 16 }}>
                  {estimating ? (<><Loader2 size={16} className="g-spin" /> {t("estimating")}</>) : t("estimateShort")}
                </button>
              </div>

              {estErr && <div className="g-err">{estErr}</div>}

              {/* OR divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 2px" }}>
                <div style={{ flex: 1, height: 1, background: "#DCD8CA" }} />
                <span style={{ fontSize: 11.5, color: "#9A9C8F", letterSpacing: ".06em" }}>{t("orDivider")}</span>
                <div style={{ flex: 1, height: 1, background: "#DCD8CA" }} />
              </div>

              {/* scan barcode */}
              <button
                onClick={() => { setEstErr(""); setScanning(true); }}
                style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", background: "#FCFAF4", border: "1px solid #E4E0D2", borderRadius: 16, padding: "14px 16px" }}
              >
                <span style={{ width: 40, height: 40, flex: "none", borderRadius: 12, background: "#F0E6D2", display: "grid", placeItems: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#C2974A">
                    <rect x="4" y="6" width="1.6" height="12" /><rect x="7.4" y="6" width="1" height="12" />
                    <rect x="9.8" y="6" width="2.4" height="12" /><rect x="13.6" y="6" width="1" height="12" />
                    <rect x="15.6" y="6" width="2" height="12" /><rect x="18.8" y="6" width="1.2" height="12" />
                  </svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="g-fg" style={{ display: "block", fontWeight: 600, fontSize: 15, color: "#1B1D17" }}>{t("scanTitle")}</span>
                  <span style={{ display: "block", fontSize: 12, color: "#9A9C8F", marginTop: 2 }}>{t("scanBarcodeSub")}</span>
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B7B9AC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </button>

              {/* favourites */}
              {templates.length > 0 && (
                <>
                  {overline(t("favourites"), { margin: "24px 2px 12px" })}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {templates.map((tpl) => (
                      <div key={tpl.id} className="g-fav">
                        <MacroMarker protein={tpl.protein} carbs={tpl.carbs} fat={tpl.fat} tileSize={34} tileRadius={11} shapeSize={13} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="g-fg" style={{ fontWeight: 500, fontSize: 14.5, color: "#1B1D17", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.name}</div>
                          <div style={{ fontSize: 11.5, color: "#9A9C8F" }}>{tpl.kcal} kcal · {t(mostlyKey(tpl.protein, tpl.carbs, tpl.fat))}</div>
                        </div>
                        <button className="g-fav-add" onClick={() => addFromTemplate(tpl)} aria-label={t("addToToday")}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M12 6v12M6 12h12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Review estimate sheet ---------- */}
      {sheet === "review" && est && (
        <div className="g-sheet-bg" onClick={resetFlow}>
          <div className="g-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="g-sheet-grab"><span /></div>
            <div className="g-sheet-head">
              <span className="g-sheet-title">{t("reviewTitle")}</span>
              <button className="g-sheet-x" onClick={resetFlow} aria-label="×"><X size={16} /></button>
            </div>
            <div className="g-sheet-body">
              {/* meal header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#FCFAF4", border: "1px solid #E4E0D2", borderRadius: 18, padding: 16, marginTop: 8 }}>
                <div style={{ width: 54, height: 54, flex: "none", borderRadius: 15, background: MACRO[rDom].tint, display: "grid", placeItems: "center" }}>
                  <MacroShape macro={rDom} size={rDom === "fat" ? 22 : 20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingName ? (
                    <input
                      className="g-input"
                      autoFocus
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      onBlur={() => setEditingName(false)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                      style={{ padding: "6px 8px", borderRadius: 10, fontSize: 16 }}
                    />
                  ) : (
                    <button onClick={() => setEditingName(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", padding: 0, textAlign: "left" }}>
                      <span className="g-fg" style={{ fontWeight: 600, fontSize: 17, color: "#1B1D17" }}>{label || est.label}</span>
                      <Pencil size={14} color="#9C9E90" />
                    </button>
                  )}
                  <div style={{ fontSize: 12, color: "#9A9C8F", marginTop: 3 }}>{t("estimatedFrom")}</div>
                </div>
              </div>

              {/* macro card */}
              <div style={{ background: "#FCFAF4", border: "1px solid #E4E0D2", borderRadius: 18, padding: 20, marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div>
                    {overline(t("caloriesLabel"))}
                    <div className="g-fg" style={{ fontWeight: 700, fontSize: 40, color: "#1B1D17", letterSpacing: "-.02em", lineHeight: 1, marginTop: 6 }}>{fmt(rKcal)}</div>
                  </div>
                  <span style={{ background: MACRO[rDom].tint, color: PILL_TEXT[rDom], fontSize: 11.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, textTransform: "capitalize" }}>
                    {t(mostlyKey(rP, rC, rF))}
                  </span>
                </div>
                <div style={{ height: 1, background: "#EBE7D9", margin: "18px 0" }} />
                {(["protein", "carbs", "fat"] as const).map((k) => {
                  const val = k === "protein" ? rP : k === "carbs" ? rC : rF;
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <MacroShape macro={k} size={10} />
                        <span className="g-fg" style={{ fontSize: 15, color: "#1B1D17" }}>{t(k)}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button className="g-step g-step-minus" onClick={() => stepMacro(k, -1)} disabled={val <= 0} aria-label="−">−</button>
                        <span className="g-fm" style={{ fontSize: 15, color: "#1B1D17", width: 44, textAlign: "center" }}>{val} g</span>
                        <button className="g-step g-step-plus" onClick={() => stepMacro(k, 1)} aria-label="+">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* portion */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                {overline(t("portion"))}
                <div style={{ display: "flex", gap: 6 }}>
                  {PORTIONS.map((p, i) => (
                    <button key={p} className={`g-portion ${portion === p ? "is-on" : ""}`} onClick={() => setPortion(p)}>
                      {PORTION_LABELS[i]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* footer */}
            <div style={{ flex: "none", padding: "14px 26px 30px", background: "linear-gradient(to top,#EFECE3 70%,rgba(239,236,227,0))" }}>
              <button className="g-btn g-btn-pri" onClick={commitReview} disabled={rKcal <= 0}>
                <Check size={16} /> {t("addToTodayBtn")}
              </button>
              <button className="g-btn g-btn-ghost" onClick={saveReviewFavourite} disabled={rKcal <= 0} style={{ marginTop: 4 }}>
                {t("saveToFav")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
