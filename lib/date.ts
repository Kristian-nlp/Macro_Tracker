// Pure date helpers shared by client and server. All dates are user-LOCAL and
// formatted as YYYY-MM-DD strings so they survive the round-trip to Postgres
// without timezone drift.

import { DAYS_LONG, DAYS_SHORT, MONTHS, MONTHS_LONG, type Lang } from "./i18n";

export const pad = (n: number) => String(n).padStart(2, "0");

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function keyOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function weekdayOf(key: string): number {
  return new Date(`${key}T00:00:00`).getDay(); // 0 Sun .. 6 Sat
}

export function dayLabel(key: string, lang: Lang = "en"): string {
  const d = new Date(`${key}T00:00:00`);
  return `${DAYS_SHORT[lang][d.getDay()]} ${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
}

/** Full weekday in caps, e.g. "MONDAY" / "MONTAG" (Today header overline). */
export function weekdayLongUpper(key: string, lang: Lang = "en"): string {
  return DAYS_LONG[lang][new Date(`${key}T00:00:00`).getDay()].toUpperCase();
}

/** Long date, e.g. "23 June" (en) / "23. Juni" (de) — Today header. */
export function dateLong(key: string, lang: Lang = "en"): string {
  const d = new Date(`${key}T00:00:00`);
  const month = MONTHS_LONG[lang][d.getMonth()];
  return lang === "de" ? `${d.getDate()}. ${month}` : `${d.getDate()} ${month}`;
}

/** Short weekday in caps, e.g. "SUN" / "SO" (History row). */
export function weekdayShortUpper(key: string, lang: Lang = "en"): string {
  return DAYS_SHORT[lang][new Date(`${key}T00:00:00`).getDay()].toUpperCase();
}

/** Short date, e.g. "22 Jun" (History row). */
export function dateShort(key: string, lang: Lang = "en"): string {
  const d = new Date(`${key}T00:00:00`);
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
}

/** A meal slot derived from a HH:MM time, used only for the meal-row meta line. */
export function slotKey(time: string): "slotBreakfast" | "slotLunch" | "slotSnack" | "slotDinner" {
  const h = Number(time.slice(0, 2)) || 0;
  if (h < 11) return "slotBreakfast";
  if (h < 15) return "slotLunch";
  if (h < 18) return "slotSnack";
  return "slotDinner";
}

export function nowTime(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + n);
  return keyOf(d);
}
