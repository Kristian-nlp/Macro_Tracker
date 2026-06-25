// Local (per-device) display preferences. Kept in localStorage rather than the
// server settings so it needs no DB migration; it's purely how Today is shown.

export type HeroView = "left" | "consumed";
export type HeroMetric = "calories" | "protein" | "carbs" | "fat";

const HERO_KEY = "mt_hero_view";
const METRIC_KEY = "mt_hero_metric";

export function getHeroView(): HeroView {
  if (typeof window === "undefined") return "left";
  return window.localStorage.getItem(HERO_KEY) === "consumed" ? "consumed" : "left";
}

export function saveHeroView(v: HeroView) {
  if (typeof window !== "undefined") window.localStorage.setItem(HERO_KEY, v);
}

const METRICS: HeroMetric[] = ["calories", "protein", "carbs", "fat"];

export function getHeroMetric(): HeroMetric {
  if (typeof window === "undefined") return "calories";
  const v = window.localStorage.getItem(METRIC_KEY);
  return (METRICS as string[]).includes(v ?? "") ? (v as HeroMetric) : "calories";
}

export function saveHeroMetric(v: HeroMetric) {
  if (typeof window !== "undefined") window.localStorage.setItem(METRIC_KEY, v);
}

// Remember the target-calculator answers (per device) so re-running pre-fills.
const PLAN_KEY = "mt_plan_inputs";

export function getPlanInputs(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PLAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePlanInputs(input: unknown) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PLAN_KEY, JSON.stringify(input));
    } catch {
      /* ignore */
    }
  }
}
