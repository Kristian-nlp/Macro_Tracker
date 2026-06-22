// Pure date helpers shared by client and server. All dates are user-LOCAL and
// formatted as YYYY-MM-DD strings so they survive the round-trip to Postgres
// without timezone drift.

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

export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function dayLabel(key: string): string {
  const d = new Date(`${key}T00:00:00`);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
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
