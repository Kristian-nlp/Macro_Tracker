// A graduated "tank" that fills toward a target, with a small overflow band when
// you go over. Reusable at any size — the big day vessel and the small per-macro
// vessels both render this.

export function Vessel({
  ratio,
  over,
  width = 84,
  height = 230,
  ticks = true,
}: {
  ratio: number;
  over: number;
  width?: number;
  height?: number;
  ticks?: boolean;
}) {
  const W = width;
  const H = height;
  const pad = Math.max(4, Math.round(width * 0.07));
  const rx = Math.min(12, Math.round(width * 0.22));
  const innerH = H - pad * 2;
  const fillFrac = Math.min(1, ratio);
  const fillH = innerH * fillFrac;
  const overH = over > 0 ? innerH * Math.min(0.16, over) : 0; // small overflow band
  const tickFracs = [0.25, 0.5, 0.75];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="cal-vessel" aria-hidden="true">
      {/* vessel body */}
      <rect
        x={pad}
        y={pad}
        width={W - pad * 2}
        height={innerH}
        rx={rx}
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
        rx={rx}
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
          rx={rx}
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
      {ticks &&
        tickFracs.map((t, i) => (
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
