// "The Grid" macro system. A meal is tagged by the macro it is *mostly made of*,
// measured by calorie contribution (protein/carbs = 4 kcal/g, fat = 9 kcal/g).
// The dominant macro drives a shape + colour used everywhere: meal rows,
// favourites, the logo, legends and markers. Derive it — never hard-code it.

export type MacroKey = "protein" | "carbs" | "fat";
export type MacroShapeKind = "circle" | "square" | "triangle";

/** Dominant macro by calorie share. Tie-break order: protein → carbs → fat. */
export function dominantMacro(protein: number, carbs: number, fat: number): MacroKey {
  const cal = { protein: protein * 4, carbs: carbs * 4, fat: fat * 9 };
  let dom: MacroKey = "protein";
  let best = cal.protein;
  // Strict `>` keeps the earlier macro on a tie (protein → carbs → fat).
  if (cal.carbs > best) {
    dom = "carbs";
    best = cal.carbs;
  }
  if (cal.fat > best) {
    dom = "fat";
    best = cal.fat;
  }
  return dom;
}

/** Shape + colour + chip tint for each macro (design tokens). */
export const MACRO: Record<MacroKey, { accent: string; tint: string; shape: MacroShapeKind }> = {
  protein: { accent: "#55654C", tint: "#E7EADF", shape: "circle" },
  carbs: { accent: "#BC6440", tint: "#F1DFD5", shape: "square" },
  fat: { accent: "#C2974A", tint: "#F0E6D2", shape: "triangle" },
};

/** Muted colour for the non-dominant macros in a meal row's P·C·F line. */
export const MACRO_MUTED = "#A6A89A";
