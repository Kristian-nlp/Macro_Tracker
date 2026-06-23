// Shape + colour markers derived from a meal's dominant macro. Used on meal
// rows, favourites, the logo and macro legends. The shapes are pure CSS:
// protein = circle, carbs = rounded square, fat = triangle.

import { dominantMacro, MACRO, type MacroKey } from "@/lib/macros";

/** A single macro glyph (circle / square / triangle) in its colour. */
export function MacroShape({
  macro,
  size = 16,
  color,
}: {
  macro: MacroKey;
  size?: number;
  color?: string;
}) {
  const c = color ?? MACRO[macro].accent;
  const shape = MACRO[macro].shape;

  if (shape === "circle") {
    return (
      <span style={{ width: size, height: size, borderRadius: "50%", background: c, display: "inline-block" }} />
    );
  }
  if (shape === "square") {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: size >= 14 ? 4 : 3,
          background: c,
          display: "inline-block",
        }}
      />
    );
  }
  // triangle — base ≈ 1.2× the visual height, pointing up
  const half = Math.round(size * 0.6);
  return (
    <span
      style={{
        width: 0,
        height: 0,
        borderLeft: `${half}px solid transparent`,
        borderRight: `${half}px solid transparent`,
        borderBottom: `${size}px solid ${c}`,
        display: "inline-block",
      }}
    />
  );
}

/** A tinted tile holding the dominant-macro shape (meal rows, favourites). */
export function MacroMarker({
  protein,
  carbs,
  fat,
  tileSize = 42,
  tileRadius = 13,
  shapeSize = 15,
}: {
  protein: number;
  carbs: number;
  fat: number;
  tileSize?: number;
  tileRadius?: number;
  shapeSize?: number;
}) {
  const dom = dominantMacro(protein, carbs, fat);
  return (
    <div
      style={{
        width: tileSize,
        height: tileSize,
        flex: "none",
        borderRadius: tileRadius,
        background: MACRO[dom].tint,
        display: "grid",
        placeItems: "center",
      }}
    >
      <MacroShape macro={dom} size={shapeSize} />
    </div>
  );
}
