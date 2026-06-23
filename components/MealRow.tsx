"use client";

import { Trash2 } from "lucide-react";
import { MacroMarker } from "@/components/MacroMarker";
import { dominantMacro, MACRO, MACRO_MUTED } from "@/lib/macros";

// A logged meal: macro marker tile · title + meta · kcal + the P·C·F line with
// the dominant macro bolded in its colour. Mirrors prototype/MealRow.dc.html.
export function MealRow({
  title,
  meta,
  kcal,
  protein,
  carbs,
  fat,
  onOpen,
  onDelete,
  deleteLabel,
}: {
  title: string;
  meta?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  onOpen?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
}) {
  const dom = dominantMacro(protein, carbs, fat);
  const sep = <span style={{ color: "#C9CBBE" }}> · </span>;
  const part = (k: "protein" | "carbs" | "fat", letter: string, value: number) => (
    <span style={{ color: dom === k ? MACRO[k].accent : MACRO_MUTED, fontWeight: dom === k ? 700 : 400 }}>
      {letter}
      {value}
    </span>
  );

  return (
    <div
      className="g-meal"
      onClick={onOpen}
      onKeyDown={onOpen ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen()) : undefined}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "11px 0",
        borderBottom: "1px solid #E4E1D3",
        cursor: onOpen ? "pointer" : undefined,
      }}
    >
      <MacroMarker protein={protein} carbs={carbs} fat={fat} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="g-fg"
          style={{
            fontWeight: 500,
            fontSize: 15,
            color: "#1B1D17",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        {meta && <div style={{ fontSize: 12, color: "#7A7E6F", marginTop: 2 }}>{meta}</div>}
      </div>
      <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span className="g-fm" style={{ fontSize: 15, color: "#1B1D17" }}>
            {kcal}
          </span>
          <span style={{ fontSize: 10, color: "#A2A496" }}>kcal</span>
        </div>
        <div className="g-fm" style={{ fontSize: 10.5, marginTop: 3, letterSpacing: ".01em" }}>
          {part("protein", "P", protein)}
          {sep}
          {part("carbs", "C", carbs)}
          {sep}
          {part("fat", "F", fat)}
        </div>
      </div>
      {onDelete && (
        <button
          className="g-meal-del"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={deleteLabel || "Delete"}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
