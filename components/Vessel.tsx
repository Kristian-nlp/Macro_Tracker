// The vessel hero — a graduated "tank" that fills toward the day's kcal target,
// with a small overflow band when you go over. Ported verbatim from the artifact.

export function Vessel({ ratio, over }: { ratio: number; over: number }) {
  const W = 84;
  const H = 230;
  const pad = 6;
  const innerH = H - pad * 2;
  const fillFrac = Math.min(1, ratio);
  const fillH = innerH * fillFrac;
  const overH = over > 0 ? innerH * Math.min(0.16, over) : 0; // small overflow band
  const ticks = [0.25, 0.5, 0.75];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="cal-vessel" aria-hidden="true">
      {/* vessel body */}
      <rect
        x={pad}
        y={pad}
        width={W - pad * 2}
        height={innerH}
        rx="12"
        fill="var(--surface-2)"
        stroke="var(--line-strong)"
        strokeWidth="1.5"
      />
      {/* main fill */}
      <rect
        x={pad}
        y={pad + innerH - fillH}
        width={W - pad * 2}
        height={fillH}
        rx="12"
        className="cal-fill"
        fill="var(--accent)"
      />
      {/* overflow band sits on top */}
      {overH > 0 && (
        <rect
          x={pad}
          y={pad + innerH - fillH - overH}
          width={W - pad * 2}
          height={overH}
          rx="12"
          fill="var(--over)"
        />
      )}
      {/* target line */}
      <line
        x1={pad - 3}
        y1={pad}
        x2={W - pad + 3}
        y2={pad}
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      {/* graduations */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={W - pad}
          y1={pad + innerH * (1 - t)}
          x2={W - pad - 9}
          y2={pad + innerH * (1 - t)}
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
