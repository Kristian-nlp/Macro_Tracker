import * as XLSX from "xlsx";
import type { Entry } from "./types";
import { dayLabel, weekdayOf } from "./date";

export type DayTypeResolver = (key: string) => "training" | "rest";
export type TargetResolver = (type: "training" | "rest") => number | null;

/**
 * Build a workbook with two sheets and trigger a real .xlsx download:
 *  - "Log":           one row per meal.
 *  - "Daily summary": one row per day (totals, target, remaining).
 */
export function downloadExcel(
  entries: Entry[],
  resolveType: DayTypeResolver,
  resolveTarget: TargetResolver,
  filenameDate: string,
): void {
  // Sheet 1 — Log (one row per meal), ordered by date then time.
  const sorted = [...entries].sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
  );
  const logRows = sorted.map((e) => ({
    Date: e.date,
    Time: e.time,
    Item: e.label,
    kcal: e.kcal,
    "Protein (g)": e.protein,
    "Carbs (g)": e.carbs,
    "Fat (g)": e.fat,
  }));
  const logSheet = XLSX.utils.json_to_sheet(logRows, {
    header: ["Date", "Time", "Item", "kcal", "Protein (g)", "Carbs (g)", "Fat (g)"],
  });
  logSheet["!cols"] = [
    { wch: 12 }, { wch: 7 }, { wch: 32 }, { wch: 8 },
    { wch: 11 }, { wch: 10 }, { wch: 8 },
  ];

  // Sheet 2 — Daily summary (one row per day).
  const byDay = new Map<string, Entry[]>();
  for (const e of sorted) {
    const list = byDay.get(e.date) ?? [];
    list.push(e);
    byDay.set(e.date, list);
  }
  const summaryRows = Array.from(byDay.keys())
    .sort()
    .map((key) => {
      const list = byDay.get(key)!;
      const total = list.reduce((a, e) => a + (e.kcal || 0), 0);
      const protein = list.reduce((a, e) => a + (e.protein || 0), 0);
      const carbs = list.reduce((a, e) => a + (e.carbs || 0), 0);
      const fat = list.reduce((a, e) => a + (e.fat || 0), 0);
      const type = resolveType(key);
      const target = resolveTarget(type);
      const remaining = target != null ? target - total : "";
      return {
        Date: key,
        "Day type": type,
        "Total kcal": total,
        Target: target ?? "",
        Remaining: remaining,
        Protein: protein,
        Carbs: carbs,
        Fat: fat,
      };
    });
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows, {
    header: ["Date", "Day type", "Total kcal", "Target", "Remaining", "Protein", "Carbs", "Fat"],
  });
  summarySheet["!cols"] = [
    { wch: 12 }, { wch: 10 }, { wch: 11 }, { wch: 9 },
    { wch: 10 }, { wch: 9 }, { wch: 8 }, { wch: 7 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, logSheet, "Log");
  XLSX.utils.book_append_sheet(wb, summarySheet, "Daily summary");
  XLSX.writeFile(wb, `calorie-log-${filenameDate}.xlsx`);
}

// Re-export for callers that build their own resolvers.
export { dayLabel, weekdayOf };
