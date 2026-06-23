"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "@/components/LangProvider";
import { addDays, dayLabel, keyOf, todayKey, weekdayOf } from "@/lib/date";
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

type DaySummary = {
  key: string;
  total: number;
  protein: number;
  carbs: number;
  fat: number;
  type: DayType;
  target: number | null;
};

export default function HistoryPage() {
  const { t, lang } = useLang();
  const today = todayKey();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [from, setFrom] = useState(addDays(today, -13));
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(true);

  // settings once
  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  // entries whenever the range changes
  useEffect(() => {
    if (from > to) return;
    setLoading(true);
    api
      .getEntriesInRange(from, to)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [from, to]);

  const resolveType = (key: string): DayType =>
    (settings.overrides[key] as DayType) ||
    (settings.trainingDays.includes(weekdayOf(key)) ? "training" : "rest");
  const resolveTarget = (type: DayType) =>
    type === "rest" ? settings.restTarget ?? settings.target : settings.target;

  const days: DaySummary[] = useMemo(() => {
    const byDay = new Map<string, Entry[]>();
    for (const e of entries) {
      const list = byDay.get(e.date) ?? [];
      list.push(e);
      byDay.set(e.date, list);
    }
    return Array.from(byDay.keys())
      .sort()
      .reverse()
      .map((key) => {
        const list = byDay.get(key)!;
        const type = resolveType(key);
        return {
          key,
          total: list.reduce((a, e) => a + (e.kcal || 0), 0),
          protein: list.reduce((a, e) => a + (e.protein || 0), 0),
          carbs: list.reduce((a, e) => a + (e.carbs || 0), 0),
          fat: list.reduce((a, e) => a + (e.fat || 0), 0),
          type,
          target: resolveTarget(type),
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, settings]);

  // averages across logged days in range
  const loggedDays = days.length;
  const avgKcal = loggedDays ? Math.round(days.reduce((a, d) => a + d.total, 0) / loggedDays) : 0;
  const avgProtein = loggedDays ? Math.round(days.reduce((a, d) => a + d.protein, 0) / loggedDays) : 0;

  function setPreset(n: number | "month") {
    if (n === "month") {
      const d = new Date(`${today}T00:00:00`);
      setFrom(keyOf(new Date(d.getFullYear(), d.getMonth(), 1)));
      setTo(today);
    } else {
      setFrom(addDays(today, -(n - 1)));
      setTo(today);
    }
  }

  const activePreset = (() => {
    if (to !== today) return null;
    if (from === addDays(today, -6)) return 7;
    if (from === addDays(today, -13)) return 14;
    if (from === addDays(today, -29)) return 30;
    const d = new Date(`${today}T00:00:00`);
    if (from === keyOf(new Date(d.getFullYear(), d.getMonth(), 1))) return "month" as const;
    return null;
  })();

  function onDownload() {
    if (!entries.length) return;
    downloadExcel(entries, resolveType, resolveTarget, today, {
      log: t("xlLog"),
      daily: t("xlDaily"),
      date: t("xlDate"),
      time: t("xlTime"),
      item: t("xlItem"),
      kcal: t("xlKcal"),
      proteinG: t("xlProteinG"),
      carbsG: t("xlCarbsG"),
      fatG: t("xlFatG"),
      dayType: t("xlDayType"),
      totalKcal: t("xlTotalKcal"),
      target: t("xlTarget"),
      remaining: t("xlRemaining"),
      protein: t("xlProtein"),
      carbs: t("xlCarbs"),
      fat: t("xlFat"),
      training: t("dayTraining"),
      rest: t("dayRest"),
    });
  }

  return (
    <>
      <header className="cal-head">
        <Link className="cal-link" href="/">
          <ChevronLeft size={16} /> {t("backToday")}
        </Link>
        <div className="cal-brand" style={{ fontSize: 14 }}>
          <span className="cal-mark" />
          <span>{t("historyTitle")}</span>
        </div>
      </header>

      {/* range selector */}
      <section className="cal-card">
        <div className="cal-eyebrow" style={{ marginBottom: 10 }}>
          {t("dateRange")}
        </div>
        <div className="cal-range">
          <div className="cal-rfield">
            <label>{t("from")}</label>
            <input
              className="cal-date"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="cal-rfield">
            <label>{t("to")}</label>
            <input
              className="cal-date"
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
        <div className="cal-presets">
          {([7, 14, 30, "month"] as const).map((p) => (
            <button
              key={String(p)}
              className={`cal-preset ${activePreset === p ? "on" : ""}`}
              onClick={() => setPreset(p)}
            >
              {p === "month"
                ? t("thisMonth")
                : p === 7
                  ? t("days7")
                  : p === 14
                    ? t("days14")
                    : t("days30")}
            </button>
          ))}
        </div>
      </section>

      {/* averages */}
      <section className="cal-card">
        <div className="cal-eyebrow" style={{ marginBottom: 10 }}>
          {t("avgPerDay")}
        </div>
        <div className="cal-avg">
          <div className="cal-avg-cell">
            <div className="cal-avg-v">
              {avgKcal}
              <span className="cal-avg-u">kcal</span>
            </div>
            <div className="cal-avg-l">{t("kcalPerDay")}</div>
          </div>
          <div className="cal-avg-cell">
            <div className="cal-avg-v">
              {avgProtein}
              <span className="cal-avg-u">g</span>
            </div>
            <div className="cal-avg-l">{t("proteinPerDay")}</div>
          </div>
          <div className="cal-avg-cell">
            <div className="cal-avg-v">{loggedDays}</div>
            <div className="cal-avg-l">{t("daysLogged")}</div>
          </div>
        </div>
      </section>

      {/* per-day list */}
      <section className="cal-card">
        <div className="cal-eyebrow" style={{ marginBottom: 8 }}>
          {t("daysHeading")}
        </div>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 20, color: "var(--muted)" }}>
            <Loader2 size={18} className="cal-spin" />
          </div>
        ) : days.length === 0 ? (
          <div className="cal-empty">{t("noMealsRange")}</div>
        ) : (
          <ul className="cal-hlist">
            {days.map((d) => {
              const tg = d.target;
              const ratio = tg ? Math.min(1, d.total / tg) : 0;
              const over = !!tg && d.total > tg;
              const remaining = tg != null ? tg - d.total : null;
              return (
                <li key={d.key} className="cal-hrow">
                  <div className="cal-hrow-top">
                    <span className="cal-hdate">
                      {dayLabel(d.key, lang)}{" "}
                      <span className="cal-hbadge">· {d.type === "training" ? t("dayTraining") : t("dayRest")}</span>
                    </span>
                    <span className="cal-hk">
                      {d.total}
                      {tg ? ` / ${tg}` : ""}
                    </span>
                  </div>
                  <div className="cal-hbar">
                    <span
                      style={{
                        width: `${ratio * 100}%`,
                        background: over ? "var(--over)" : "var(--accent)",
                      }}
                    />
                  </div>
                  <div className="cal-hmeta">
                    P {d.protein} · C {d.carbs} · F {d.fat}
                    {remaining != null && (
                      <>
                        {" · "}
                        {remaining >= 0
                          ? t("nLeft", { n: remaining })
                          : t("nOver", { n: Math.abs(remaining) })}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="cal-foot">
        <button className="cal-btn cal-btn-pri" onClick={onDownload} disabled={!entries.length}>
          <Download size={15} /> {t("downloadExcel")}
        </button>
        <span className="cal-foot-note">{t("excelNote")}</span>
      </div>
    </>
  );
}
