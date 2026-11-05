export function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 320;
  const h = 80;
  const max = Math.max(...points, 1);
  const step = w / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (p / max) * h).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-20 w-full" role="img" aria-label="Speed over time">
      <path d={`${d} L${w},${h} L0,${h} Z`} className="fill-blush-200/60" />
      <path d={d} className="fill-none stroke-blush-500" strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
