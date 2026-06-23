export type Entry = {
  id: string;
  date: string;
  time: string;
  label: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  note: string | null;
};

export type Settings = {
  // Training day targets
  target: number | null; // kcal
  trainingProtein: number | null;
  trainingCarbs: number | null;
  trainingFat: number | null;
  // Rest day targets
  restTarget: number | null; // kcal (falls back to `target` when null)
  restProtein: number | null;
  restCarbs: number | null;
  restFat: number | null;
  trainingDays: number[];
  overrides: Record<string, string>;
};

export type Template = {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DayType = "training" | "rest";

export type EstimateResult = {
  label: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  note: string;
};
