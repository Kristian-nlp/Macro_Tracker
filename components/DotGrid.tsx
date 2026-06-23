// The signature calorie hero: 36 dots in 3 rows × 12 columns. The fill is driven
// by the daily target — filled = round(min(consumed/target, 1) × 36). Filled
// dots are sage when under target; every dot turns terracotta when over budget.
// Reused at small scale on History (one mini-grid per day).

const TOTAL = 36;
const SAGE = "#55654C";
const TERRACOTTA = "#BC6440";
const EMPTY = "#DCE0D2";

/** How many dots are filled for a given consumed / target. */
export function filledDots(consumed: number, target: number): number {
  if (!(target > 0)) return 0;
  return Math.round(Math.min(consumed / target, 1) * TOTAL);
}

export function DotGrid({
  consumed,
  target,
  mini = false,
}: {
  consumed: number;
  target: number;
  mini?: boolean;
}) {
  const over = target > 0 && consumed > target;
  const filled = filledDots(consumed, target);
  return (
    <div className={mini ? "g-grid g-grid--mini" : "g-grid"} style={mini ? undefined : { marginTop: 20 }} aria-hidden="true">
      {Array.from({ length: TOTAL }, (_, i) => (
        <span
          key={i}
          className="g-dot"
          style={{ background: over ? TERRACOTTA : i < filled ? SAGE : EMPTY }}
        />
      ))}
    </div>
  );
}
