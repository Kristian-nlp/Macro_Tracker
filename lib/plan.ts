// Target calculator. Estimates training-day and rest-day calorie + macro
// targets from a short profile (age, gender, height, weight, activity, goal).
// Uses the Mifflin–St Jeor BMR, an activity multiplier (TDEE), and a goal
// adjustment, with light calorie-cycling (training day a bit higher than rest).
// The /api/plan route may hand these numbers to the LLM to personalize; this
// module is also the deterministic fallback and the validator for AI output.

export type Gender = "male" | "female";
export type ActivityKey = "sedentary" | "light" | "moderate" | "active" | "very";
export type GoalKey = "lose_fat" | "lose_keep" | "recomp" | "gain_muscle" | "gain_mass";

export type PlanInput = {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activity: ActivityKey;
  goal: GoalKey;
};

export type Plan = {
  trainingKcal: number;
  trainingProtein: number;
  trainingCarbs: number;
  trainingFat: number;
  restKcal: number;
  restProtein: number;
  restCarbs: number;
  restFat: number;
  rationale?: string;
  source?: "ai" | "formula";
};

export const ACTIVITIES: ActivityKey[] = ["sedentary", "light", "moderate", "active", "very"];
export const GOAL_KEYS: GoalKey[] = ["lose_fat", "lose_keep", "recomp", "gain_muscle", "gain_mass"];

export const ACTIVITY_FACTORS: Record<ActivityKey, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
};

// calorieFactor multiplies maintenance (TDEE); protein/fat are grams per kg.
export const GOALS: Record<GoalKey, { calorieFactor: number; proteinPerKg: number; fatPerKg: number }> = {
  lose_fat: { calorieFactor: 0.8, proteinPerKg: 2.0, fatPerKg: 0.8 },
  lose_keep: { calorieFactor: 0.85, proteinPerKg: 2.2, fatPerKg: 0.8 },
  recomp: { calorieFactor: 1.0, proteinPerKg: 2.1, fatPerKg: 0.9 },
  gain_muscle: { calorieFactor: 1.1, proteinPerKg: 2.0, fatPerKg: 0.9 },
  gain_mass: { calorieFactor: 1.18, proteinPerKg: 1.8, fatPerKg: 1.0 },
};

export function isValidInput(i: Partial<PlanInput>): i is PlanInput {
  return (
    typeof i.age === "number" && i.age >= 15 && i.age <= 80 &&
    (i.gender === "male" || i.gender === "female") &&
    typeof i.heightCm === "number" && i.heightCm >= 80 && i.heightCm <= 260 &&
    typeof i.weightKg === "number" && i.weightKg >= 30 && i.weightKg <= 300 &&
    !!i.activity && ACTIVITIES.includes(i.activity) &&
    !!i.goal && GOAL_KEYS.includes(i.goal)
  );
}

export function bmrMifflin(i: PlanInput): number {
  const base = 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.age;
  return Math.round(i.gender === "male" ? base + 5 : base - 161);
}

export function tdee(i: PlanInput): number {
  return Math.round(bmrMifflin(i) * ACTIVITY_FACTORS[i.activity]);
}

const round10 = (n: number) => Math.max(0, Math.round(n / 10) * 10);

export function computeBaseline(i: PlanInput): Plan {
  const goalCals = tdee(i) * GOALS[i.goal].calorieFactor;
  // Calorie-cycle ±8% so the weekly average lands near the goal calories.
  const trainingKcal = round10(goalCals * 1.08);
  const restKcal = round10(goalCals * 0.92);
  const proteinG = Math.round(i.weightKg * GOALS[i.goal].proteinPerKg);
  const fatG = Math.round(i.weightKg * GOALS[i.goal].fatPerKg);
  // Protein + fat stay roughly constant; carbs absorb the day-to-day difference.
  const carbsFrom = (kcal: number) => Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4));
  return {
    trainingKcal,
    trainingProtein: proteinG,
    trainingCarbs: carbsFrom(trainingKcal),
    trainingFat: fatG,
    restKcal,
    restProtein: proteinG,
    restCarbs: carbsFrom(restKcal),
    restFat: fatG,
    source: "formula",
  };
}

/** Validate/clamp a candidate plan (e.g. from the LLM); null if implausible. */
export function sanePlan(p: Record<string, unknown>, i: PlanInput): Plan | null {
  const base = computeBaseline(i);
  const n = (v: unknown, fallback: number) => {
    const x = Math.round(Number(v));
    return Number.isFinite(x) && x >= 0 ? x : fallback;
  };
  const out: Plan = {
    trainingKcal: n(p.trainingKcal, base.trainingKcal),
    trainingProtein: n(p.trainingProtein, base.trainingProtein),
    trainingCarbs: n(p.trainingCarbs, base.trainingCarbs),
    trainingFat: n(p.trainingFat, base.trainingFat),
    restKcal: n(p.restKcal, base.restKcal),
    restProtein: n(p.restProtein, base.restProtein),
    restCarbs: n(p.restCarbs, base.restCarbs),
    restFat: n(p.restFat, base.restFat),
    rationale: typeof p.rationale === "string" ? p.rationale.slice(0, 240) : undefined,
    source: "ai",
  };
  const within = (val: number, b: number, tol: number) => val >= b * (1 - tol) && val <= b * (1 + tol);
  if (!within(out.trainingKcal, base.trainingKcal, 0.35)) return null;
  if (!within(out.restKcal, base.restKcal, 0.35)) return null;
  const pPerKg = out.trainingProtein / i.weightKg;
  if (pPerKg < 1.2 || pPerKg > 2.8) return null;
  return out;
}
