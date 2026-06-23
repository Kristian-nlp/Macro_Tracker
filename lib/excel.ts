import * as XLSX from "xlsx";
import type { Entry } from "./types";

export type DayTypeResolver = (key: string) => "training" | "rest";
export type TargetResolver = (type: "training" | "rest") => number | null;

export type ExcelLabels = {
  log: string;
  daily: string;
  date: string;
  time: string;
  item: string;
  kcal: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  dayType: string;
  totalKcal: string;
  target: string;
  remaining: string;
  protein: string;
  carbs: string;
  fat: string;
  training: string;
  rest: string;
};

/**
 * Build a workbook with two sheets and trigger a real .xlsx download. Column
 * and sheet names come from `labels` so the export matches the chosen language.
 */
export function downloadExcel(
  entries: Entry[],
  resolveType: DayTypeResolver,
  resolveTarget: TargetResolver,
  filenameDate: string,
  labels: ExcelLabels,
): void {
  const sorted = [...entries].sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
  );

  // Sheet 1 — Log (one row per meal).
  const logHeader = [
    labels.date,
    labels.time,
    labels.item,
    labels.kcal,
    labels.proteinG,
    labels.carbsG,
    labels.fatG,
  ];
  const logRows = sorted.map((e) => ({
    [labels.date]: e.date,
    [labels.time]: e.time,
    [labels.item]: e.label,
    [labels.kcal]: e.kcal,
    [labels.proteinG]: e.protein,
    [labels.carbsG]: e.carbs,
    [labels.fatG]: e.fat,
  }));
  const logSheet = XLSX.utils.json_to_sheet(logRows, { header: logHeader });
  logSheet["!cols"] = [
    { wch: 12 }, { wch: 7 }, { wch: 32 }, { wch: 8 }, { wch: 11 }, { wch: 11 }, { wch: 8 },
  ];

  // Sheet 2 — Daily summary (one row per day).
  const byDay = new Map<string, Entry[]>();
  for (const e of sorted) {
    const list = byDay.get(e.date) ?? [];
    list.push(e);
    byDay.set(e.date, list);
  }
  const summaryHeader = [
    labels.date,
    labels.dayType,
    labels.totalKcal,
    labels.target,
    labels.remaining,
    labels.protein,
    labels.carbs,
    labels.fat,
  ];
  const summaryRows = Array.from(byDay.keys())
    .sort()
    .map((key) => {
      const list = byDay.get(key)!;
      const total = list.reduce((a, e) => a + (e.kcal || 0), 0);
      const protein = list.reduce((a, e) => a + (e.protein || 0), 0);
      const carbs = list.reduce((a, e) => a + (e.carbs || 0), 0);
      const fat = list.reduce((a, e) => a + (e.fat || 0), 0);
      const type = resolveType(key);
      const targetVal = resolveTarget(type);
      return {
        [labels.date]: key,
        [labels.dayType]: type === "training" ? labels.training : labels.rest,
        [labels.totalKcal]: total,
        [labels.target]: targetVal ?? "",
        [labels.remaining]: targetVal != null ? targetVal - total : "",
        [labels.protein]: protein,
        [labels.carbs]: carbs,
        [labels.fat]: fat,
      };
    });
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows, { header: summaryHeader });
  summarySheet["!cols"] = [
    { wch: 12 }, { wch: 12 }, { wch: 11 }, { wch: 9 }, { wch: 10 }, { wch: 9 }, { wch: 11 }, { wch: 8 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, logSheet, labels.log);
  XLSX.utils.book_append_sheet(wb, summarySheet, labels.daily);
  XLSX.writeFile(wb, `calorie-log-${filenameDate}.xlsx`);
}
