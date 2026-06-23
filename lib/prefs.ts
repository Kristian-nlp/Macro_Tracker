// Local (per-device) display preferences. Kept in localStorage rather than the
// server settings so it needs no DB migration; it's purely how Today is shown.

export type HeroView = "left" | "consumed";

const HERO_KEY = "mt_hero_view";

export function getHeroView(): HeroView {
  if (typeof window === "undefined") return "left";
  return window.localStorage.getItem(HERO_KEY) === "consumed" ? "consumed" : "left";
}

export function saveHeroView(v: HeroView) {
  if (typeof window !== "undefined") window.localStorage.setItem(HERO_KEY, v);
}
