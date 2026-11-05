type Props = { points: number[]; label: string; xLabel: string; highlight?: (i: number) => boolean };

const W = 600;
const H = 220;
const PAD = { left: 40, right: 10, top: 20, bottom: 30 };

export function LineChart({ points, label, xLabel, highlight }: Props) {
  if (points.length < 2) {
    return <p className="py-10 text-center text-muted">finish a few more and your line will show up here</p>;
  }
  const max = niceMax(Math.max(...points));
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => H - PAD.bottom - (v / max) * (H - PAD.top - PAD.bottom);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
      {[0, max / 2, max].map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeDasharray={v === 0 ? undefined : '4 4'} />
          <text x={PAD.left - 8} y={y(v) + 4} fontSize="12" fill="var(--color-muted)" textAnchor="end">
            {Math.round(v)}
          </text>
        </g>
      ))}
      <text x={W - PAD.right} y={H - 8} fontSize="12" fill="var(--color-muted)" textAnchor="end">
        {xLabel}
      </text>
      <polyline fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={line} />
      {highlight &&
        points.map((p, i) => (highlight(i) ? <circle key={i} cx={x(i)} cy={y(p)} r="5" fill="var(--color-berry)" /> : null))}
    </svg>
  );
}

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const step = v <= 50 ? 10 : 20;
  return Math.ceil(v / step) * step;
}
