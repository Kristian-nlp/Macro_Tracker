"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { DotGrid } from "@/components/DotGrid";
import { MealRow } from "@/components/MealRow";
import { BottomNav } from "@/components/BottomNav";
import { useLang } from "@/components/LangProvider";
import { api } from "@/lib/api";
import { addDays, dateShort, dayLabel, slotKey, todayKey, weekdayOf, weekdayShortUpper } from "@/lib/date";
import { downloadExcel } from "@/lib/excel";
import type { DayType, Entry, Settings } from "@/lib/types";

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

const WINDOW_DAYS = 30; // recent days shown + exported

export default function HistoryPage() {
  const { t, lang } = useLang();
  const today = todayKey();
  const from = addDays(today, -(WINDOW_DAYS - 1));
  const fmt = (n: number) => n.toLocaleString(lang === "de" ? "de-DE" : "en-US");

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getEntriesInRange(from, today)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveType = (key: string): DayType =>
    (settings.overrides[key] as DayType) ||
    (settings.trainingDays.includes(weekdayOf(key)) ? "training" : "rest");
  const resolveTarget = (type: DayType) =>
    type === "rest" ? settings.restTarget ?? settings.target : settings.target;

  // per-day totals keyed by date
  const byDay = useMemo(() => {
    const m = new Map<string, { total: number; type: DayType; target: number | null }>();
    const sums = new Map<string, number>();
    for (const e of entries) sums.set(e.date, (sums.get(e.date) ?? 0) + (e.kcal || 0));
    for (const [key, total] of sums) {
      const type = resolveType(key);
      m.set(key, { total, type, target: resolveTarget(type) });
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, settings]);

  // last 7 calendar days → average card + week strip
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const key = addDays(today, -(6 - i));
      const d = byDay.get(key);
      const onTarget = d ? d.target == null || d.total <= d.target : false;
      return { key, has: !!d, total: d?.total ?? 0, onTarget };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byDay]);

  const logged7 = last7.filter((d) => d.has);
  const avgKcal = logged7.length ? Math.round(logged7.reduce((a, d) => a + d.total, 0) / logged7.length) : 0;
  const onTargetCount = last7.filter((d) => d.has && d.onTarget).length;

  // recent days list (newest first)
  const recent = useMemo(
    () => Array.from(byDay.keys()).sort().reverse().map((key) => ({ key, ...byDay.get(key)! })),
    [byDay],
  );

  function onDownload() {
    if (!entries.length) return;
    downloadExcel(entries, resolveType, resolveTarget, today, {
      log: t("xlLog"), daily: t("xlDaily"), date: t("xlDate"), time: t("xlTime"), item: t("xlItem"),
      kcal: t("xlKcal"), proteinG: t("xlProteinG"), carbsG: t("xlCarbsG"), fatG: t("xlFatG"),
      dayType: t("xlDayType"), totalKcal: t("xlTotalKcal"), target: t("xlTarget"), remaining: t("xlRemaining"),
      protein: t("xlProtein"), carbs: t("xlCarbs"), fat: t("xlFat"), training: t("dayTraining"), rest: t("dayRest"),
    });
  }

  return (
    <div className="g-screen">
      <div className="g-scroll">
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 26px 0" }}>
          <span className="g-fg" style={{ fontWeight: 700, fontSize: 26, color: "#1B1D17", letterSpacing: "-.02em" }}>{t("historyTitle")}</span>
          <button className="g-link" onClick={onDownload} disabled={!entries.length} style={{ opacity: entries.length ? 1 : 0.5 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#55654C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
            {t("exportShort")}
          </button>
        </div>

        {/* 7-day average card */}
        <div style={{ margin: "18px 26px 0", background: "#55654C", borderRadius: 20, padding: 20, color: "#fff" }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.7)", fontWeight: 600 }}>{t("sevenDayAvg")}</div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <span className="g-fg" style={{ fontWeight: 700, fontSize: 38, lineHeight: 0.9 }}>{fmt(avgKcal)}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginBottom: 5 }}>{t("kcalSlashDay")}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="g-fg" style={{ fontWeight: 700, fontSize: 20 }}>{onTargetCount}/7</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{t("onTarget")}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 16 }}>
            {last7.map((d) => (
              <div
                key={d.key}
                style={{ flex: 1, height: 6, borderRadius: 3, background: !d.has ? "rgba(255,255,255,.4)" : d.onTarget ? "rgba(255,255,255,.85)" : "#C2974A" }}
              />
            ))}
          </div>
        </div>

        {/* recent days */}
        <div className="g-overline" style={{ margin: "22px 26px 6px" }}>{t("recentDays")}</div>
        <div style={{ margin: "0 26px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24, color: "var(--muted)" }}><Loader2 size={18} className="g-spin" /></div>
          ) : recent.length === 0 ? (
            <div style={{ fontSize: 14, color: "#9A9C8F", padding: "16px 0" }}>{t("noMealsRange")}</div>
          ) : (
            recent.map((d) => {
              const delta = d.target != null ? d.total - d.target : null;
              const isOver = delta != null && delta > 0;
              return (
                <div
                  key={d.key}
                  onClick={() => setSelectedDay(d.key)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelectedDay(d.key))}
                  role="button"
                  tabIndex={0}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid #E4E1D3", cursor: "pointer" }}
                >
                  <div style={{ width: 42, flex: "none" }}>
                    <div style={{ fontSize: 10, letterSpacing: ".06em", color: "#9A9C8F", fontWeight: 600 }}>{weekdayShortUpper(d.key, lang)}</div>
                    <div className="g-fg" style={{ fontWeight: 600, fontSize: 14, color: "#1B1D17" }}>{dateShort(d.key, lang)}</div>
                  </div>
                  <DotGrid consumed={d.total} target={d.target ?? 0} mini />
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div className="g-fm" style={{ fontSize: 14, color: "#1B1D17" }}>{fmt(d.total)}</div>
                    {delta != null && (
                      <div
                        className="g-fm"
                        style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: isOver ? "#BC6440" : "#41503A", background: isOver ? "#F3E2D9" : "#E7EADF", borderRadius: 6, padding: "1px 7px", marginTop: 3 }}
                      >
                        {isOver ? "+" : "−"}{Math.abs(delta)}
                      </div>
                    )}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2C4B7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M9 6l6 6-6 6" /></svg>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* day detail — everything eaten on the tapped day */}
      {selectedDay &&
        (() => {
          const dayMeals = entries.filter((e) => e.date === selectedDay);
          const sum = byDay.get(selectedDay);
          const dP = dayMeals.reduce((a, e) => a + (e.protein || 0), 0);
          const dC = dayMeals.reduce((a, e) => a + (e.carbs || 0), 0);
          const dF = dayMeals.reduce((a, e) => a + (e.fat || 0), 0);
          const tgt = sum?.target ?? null;
          return (
            <div className="g-sheet-bg" onClick={() => setSelectedDay(null)}>
              <div className="g-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="g-sheet-grab"><span /></div>
                <div className="g-sheet-head">
                  <span className="g-sheet-title">{dayLabel(selectedDay, lang)}</span>
                  <button className="g-sheet-x" onClick={() => setSelectedDay(null)} aria-label="×"><X size={16} /></button>
                </div>
                <div className="g-sheet-body" style={{ paddingBottom: 26 }}>
                  {/* day summary */}
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", background: "#FCFAF4", border: "1px solid #E4E0D2", borderRadius: 18, padding: 16, marginTop: 8 }}>
                    <div>
                      <div className="g-overline">{t("caloriesLabel")}</div>
                      <div className="g-fg" style={{ fontWeight: 700, fontSize: 32, color: "#1B1D17", letterSpacing: "-.02em", lineHeight: 1, marginTop: 4 }}>
                        {fmt(sum?.total ?? 0)}
                        {tgt ? <span style={{ fontSize: 14, color: "#9A9C8F", fontWeight: 400 }}> / {fmt(tgt)}</span> : null}
                      </div>
                    </div>
                    <div className="g-fm" style={{ fontSize: 13, color: "#7A7E6F", textAlign: "right" }}>P{dP} · C{dC} · F{dF}</div>
                  </div>
                  {/* every meal that day */}
                  <div style={{ marginTop: 8 }}>
                    {dayMeals.length === 0 ? (
                      <div style={{ fontSize: 14, color: "#9A9C8F", padding: "16px 0" }}>{t("nothingLogged")}</div>
                    ) : (
                      dayMeals.map((e) => (
                        <MealRow key={e.id} title={e.label} meta={`${t(slotKey(e.time))} · ${e.time}`} kcal={e.kcal} protein={e.protein} carbs={e.carbs} fat={e.fat} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      <div className="g-footer">
        <BottomNav active="history" labels={{ today: t("backToday"), history: t("historyTitle"), settings: t("settingsTitle"), add: t("addMeal") }} />
      </div>
    </div>
  );
}
