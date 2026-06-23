"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MacroShape } from "@/components/MacroMarker";
import { BottomNav } from "@/components/BottomNav";
import { useLang } from "@/components/LangProvider";
import { api } from "@/lib/api";
import { addDays, todayKey, weekdayOf } from "@/lib/date";
import { downloadExcel } from "@/lib/excel";
import type { DayType, Settings } from "@/lib/types";
import type { MacroKey } from "@/lib/macros";

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

type NumField =
  | "target"
  | "restTarget"
  | "trainingProtein"
  | "trainingCarbs"
  | "trainingFat"
  | "restProtein"
  | "restCarbs"
  | "restFat";

// Right-aligned, borderless numeric value that is tappable to edit. Module-level
// so it stays mounted across keystrokes (an inner component would remount and
// drop focus after every digit).
function TargetValue({ value, suffix, onChange }: { value: number | null; suffix: string; onChange: (raw: string) => void }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
      <input
        className="g-fm"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        aria-label={suffix}
        style={{ width: 64, border: "none", background: "none", textAlign: "right", fontSize: 15, color: "#1B1D17", outline: "none" }}
      />
      <span style={{ color: "#9A9C8F", fontSize: 12 }}>{suffix}</span>
    </span>
  );
}

export default function SettingsPage() {
  const { t, lang, setLang } = useLang();
  const today = todayKey();
  const fmt = (n: number) => n.toLocaleString(lang === "de" ? "de-DE" : "en-US");

  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [username, setUsername] = useState("");
  const [favCount, setFavCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [macroDay, setMacroDay] = useState<DayType>("training"); // which set the macro targets edit

  useEffect(() => {
    (async () => {
      try {
        const [me, s, tpls] = await Promise.all([api.getMe(), api.getSettings(), api.getTemplates()]);
        setUsername(me.username);
        setSettings(s);
        setFavCount(tpls.length);
      } catch {
        /* ignore */
      }
      setLoaded(true);
    })();
  }, []);

  function persist(next: Settings) {
    setSettings(next);
    api.putSettings(next).catch(() => {});
  }
  function setNum(field: NumField, raw: string) {
    const v = raw === "" ? null : Math.max(0, Math.round(Number(raw) || 0));
    persist({ ...settings, [field]: v });
  }

  const todayType: DayType =
    (settings.overrides[today] as DayType) ||
    (settings.trainingDays.includes(weekdayOf(today)) ? "training" : "rest");
  function setDayType(type: DayType) {
    const auto: DayType = settings.trainingDays.includes(weekdayOf(today)) ? "training" : "rest";
    const overrides = { ...settings.overrides };
    if (type === auto) delete overrides[today];
    else overrides[today] = type;
    persist({ ...settings, overrides });
  }

  async function onExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const entries = await api.getEntriesInRange(addDays(today, -29), today);
      if (!entries.length) return;
      const resolveType = (key: string): DayType =>
        (settings.overrides[key] as DayType) || (settings.trainingDays.includes(weekdayOf(key)) ? "training" : "rest");
      const resolveTarget = (type: DayType) => (type === "rest" ? settings.restTarget ?? settings.target : settings.target);
      downloadExcel(entries, resolveType, resolveTarget, today, {
        log: t("xlLog"), daily: t("xlDaily"), date: t("xlDate"), time: t("xlTime"), item: t("xlItem"),
        kcal: t("xlKcal"), proteinG: t("xlProteinG"), carbsG: t("xlCarbsG"), fatG: t("xlFatG"),
        dayType: t("xlDayType"), totalKcal: t("xlTotalKcal"), target: t("xlTarget"), remaining: t("xlRemaining"),
        protein: t("xlProtein"), carbs: t("xlCarbs"), fat: t("xlFat"), training: t("dayTraining"), rest: t("dayRest"),
      });
    } catch {
      /* ignore */
    } finally {
      setExporting(false);
    }
  }

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  const card: React.CSSProperties = { background: "#FCFAF4", border: "1px solid #E8E4D6", borderRadius: 18, padding: "4px 16px" };
  const rowBase: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0" };
  const rowDiv: React.CSSProperties = { ...rowBase, borderBottom: "1px solid #EBE7D9" };
  const labelFg: React.CSSProperties = { fontFamily: "var(--fg)", fontSize: 15, color: "#1B1D17", display: "flex", alignItems: "center", gap: 9 };

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 240, color: "var(--muted)" }}>
        <Loader2 size={18} className="g-spin" />
      </div>
    );
  }

  const macroRows: { key: MacroKey; field: NumField }[] =
    macroDay === "rest"
      ? [
          { key: "protein", field: "restProtein" },
          { key: "carbs", field: "restCarbs" },
          { key: "fat", field: "restFat" },
        ]
      : [
          { key: "protein", field: "trainingProtein" },
          { key: "carbs", field: "trainingCarbs" },
          { key: "fat", field: "trainingFat" },
        ];

  return (
    <div className="g-screen">
      <div className="g-scroll" style={{ padding: "0 26px" }}>
        <div className="g-fg" style={{ fontWeight: 700, fontSize: 26, color: "#1B1D17", letterSpacing: "-.02em", padding: "12px 0 0" }}>{t("settingsTitle")}</div>

        {/* profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#FCFAF4", border: "1px solid #E8E4D6", borderRadius: 18, padding: 14, marginTop: 16 }}>
          <div className="g-fg" style={{ width: 46, height: 46, borderRadius: "50%", background: "#55654C", display: "grid", placeItems: "center", color: "#fff", fontWeight: 600, fontSize: 18 }}>
            {(username[0] || "?").toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div className="g-fg" style={{ fontWeight: 600, fontSize: 16, color: "#1B1D17", textTransform: "capitalize" }}>{username || "—"}</div>
            <div style={{ fontSize: 12.5, color: "#9A9C8F" }}>@{username}</div>
          </div>
        </div>

        {/* daily targets */}
        <div className="g-overline" style={{ margin: "22px 2px 10px" }}>{t("dailyTargets")}</div>
        <div style={card}>
          <div style={rowDiv}>
            <span style={labelFg}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#55654C" }} />{t("trainingDayRow")}</span>
            <TargetValue value={settings.target} suffix={t("xlKcal")} onChange={(r) => setNum("target", r)} />
          </div>
          <div style={rowDiv}>
            <span style={labelFg}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#B7B9AC" }} />{t("restDayRow")}</span>
            <TargetValue value={settings.restTarget} suffix={t("xlKcal")} onChange={(r) => setNum("restTarget", r)} />
          </div>
          <div style={rowBase}>
            <span style={labelFg}>{t("todayIs")}</span>
            <div className="g-daytype">
              <button className={todayType === "training" ? "is-on" : ""} onClick={() => setDayType("training")}>{t("training")}</button>
              <button className={todayType === "rest" ? "is-on" : ""} onClick={() => setDayType("rest")}>{t("rest")}</button>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "10px 4px 0", fontSize: 12, color: "#9A9C8F", lineHeight: 1.45 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A99B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 1 }}>
            <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
          </svg>
          {t("targetsRefill")}
        </div>

        {/* macro targets — per training / rest day */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "20px 2px 10px" }}>
          <span className="g-overline">{t("macroTargets")}</span>
          <div className="g-daytype">
            <button className={macroDay === "training" ? "is-on" : ""} onClick={() => setMacroDay("training")}>{t("training")}</button>
            <button className={macroDay === "rest" ? "is-on" : ""} onClick={() => setMacroDay("rest")}>{t("rest")}</button>
          </div>
        </div>
        <div style={card}>
          {macroRows.map((m, i) => (
            <div key={m.key} style={i < macroRows.length - 1 ? rowDiv : rowBase}>
              <span style={labelFg}><MacroShape macro={m.key} size={10} />{t(m.key)}</span>
              <TargetValue value={settings[m.field]} suffix="g" onChange={(r) => setNum(m.field, r)} />
            </div>
          ))}
        </div>

        {/* data */}
        <div className="g-overline" style={{ margin: "20px 2px 10px" }}>{t("dataSection")}</div>
        <div style={card}>
          <div style={rowDiv}>
            <span style={labelFg}>{t("favourites")}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#9A9C8F" }}>
              <span className="g-fm" style={{ fontSize: 14 }}>{favCount}</span>
            </span>
          </div>
          <div style={rowDiv}>
            <span style={labelFg}>{t("language")}</span>
            <div className="g-daytype">
              <button className={lang === "en" ? "is-on" : ""} onClick={() => setLang("en")}>EN</button>
              <button className={lang === "de" ? "is-on" : ""} onClick={() => setLang("de")}>DE</button>
            </div>
          </div>
          <button onClick={onExport} disabled={exporting} style={{ ...rowBase, width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}>
            <span style={labelFg}>{t("exportToExcel")}</span>
            {exporting ? (
              <Loader2 size={18} className="g-spin" color="#55654C" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55654C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
            )}
          </button>
        </div>

        <button className="g-signout" onClick={signOut} style={{ margin: "22px 0 8px" }}>{t("signOut")}</button>
      </div>

      <div className="g-footer">
        <BottomNav active="settings" labels={{ today: t("backToday"), history: t("historyTitle"), settings: t("settingsTitle"), add: t("addMeal") }} />
      </div>
    </div>
  );
}
