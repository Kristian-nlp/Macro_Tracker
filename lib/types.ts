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
  target: number | null;
  restTarget: number | null;
  proteinTarget: number | null;
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
