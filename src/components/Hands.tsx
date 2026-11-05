import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { homeKey, type Finger } from '../data/fingers';

type Side = 'left' | 'right';
type Digit = 'pinky' | 'ring' | 'middle' | 'index';
type Point = { x: number; y: number };

const digits: Digit[] = ['pinky', 'ring', 'middle', 'index'];
// How far below its home key each knuckle sits, so the fingers arch like a real hand.
const knuckleDrop: Record<Digit, number> = { pinky: 92, ring: 110, middle: 118, index: 110 };
// Fingertips rest on the lower half of a key so its letter stays readable.
const TIP_OFFSET = 21;

type Props = {
  /** Fingers pressing for the next character: the key's finger first, then a shift pinky. */
  active: readonly Finger[];
  /** The key the first active finger reaches for. */
  target?: string;
};

/**
 * Semi-transparent hands drawn over the on-screen keyboard, fingertips on the keys.
 * Place it inside the positioned element that holds the keys; each key needs a `data-key` attribute.
 */
export function Hands({ active, target }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const centers = useKeyCenters(svg);
  return (
    <svg ref={svg} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      {centers && <Hand side="left" centers={centers} active={active} target={target} />}
      {centers && <Hand side="right" centers={centers} active={active} target={target} />}
    </svg>
  );
}

function useKeyCenters(svg: RefObject<SVGSVGElement | null>): Map<string, Point> | null {
  const [centers, setCenters] = useState<Map<string, Point> | null>(null);
  useLayoutEffect(() => {
    const el = svg.current?.parentElement;
    if (!el) return;
    const measure = () => {
      const origin = el.getBoundingClientRect();
      const next = new Map<string, Point>();
      el.querySelectorAll<HTMLElement>('[data-key]').forEach((k) => {
        const r = k.getBoundingClientRect();
        next.set(k.dataset.key ?? '', { x: r.left - origin.left + r.width / 2, y: r.top - origin.top + r.height / 2 });
      });
      setCenters(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [svg]);
  return centers;
}

type HandProps = { side: Side; centers: Map<string, Point>; active: readonly Finger[]; target?: string };

function Hand({ side, centers, active, target }: HandProps) {
  const home = digits.map((d) => centers.get(homeKey[`${side} ${d}`]));
  const space = centers.get(' ');
  if (!space || home.some((h) => h === undefined)) return null;
  const rests = home as Point[];
  const cx = rests.reduce((sum, p) => sum + p.x, 0) / rests.length;
  const homeY = rests[0]!.y;
  const inward = side === 'left' ? 1 : -1;

  const fingers = digits.map((d, i) => {
    const finger: Finger = `${side} ${d}`;
    const rest = rests[i]!;
    let tip = rest;
    if (active[0] === finger && target) tip = centers.get(target) ?? rest;
    else if (active[1] === finger) tip = centers.get(`shift-${side}`) ?? rest;
    return {
      finger,
      on: active.includes(finger),
      knuckle: { x: cx + (rest.x - cx) * 0.78, y: rest.y + knuckleDrop[d] },
      tip: { x: tip.x, y: tip.y + TIP_OFFSET },
    };
  });
  const thumb = {
    finger: 'thumb' as const,
    on: active.includes('thumb'),
    knuckle: { x: cx + inward * 52, y: homeY + 158 },
    tip: { x: space.x - inward * 58, y: space.y + 6 },
  };
  const all = [...fingers, thumb];
  const pinky = fingers[0]!.knuckle;
  const index = fingers[3]!.knuckle;
  const wristY = homeY + 206;
  const wristIn = cx + inward * 40;
  const wristOut = cx - inward * 58;
  // Back of the hand: along the knuckles, down past the thumb to the wrist, and back up the outside.
  const palm = [
    `M${pinky.x - inward * 14} ${pinky.y + 4}`,
    `Q${(pinky.x + index.x) / 2} ${Math.min(pinky.y, index.y) - 34} ${index.x + inward * 14} ${index.y + 2}`,
    `Q${index.x + inward * 22} ${homeY + 150} ${wristIn} ${wristY}`,
    `L${wristOut} ${wristY}`,
    `Q${pinky.x - inward * 20} ${homeY + 160} ${pinky.x - inward * 14} ${pinky.y + 4}`,
    'Z',
  ].join(' ');
  const heart = { x: (pinky.x + index.x) / 2, y: homeY + 150 };

  return (
    <g>
      {/* One layer at one opacity, so overlapping parts don't show darker seams. */}
      <g opacity={0.6}>
        {all.map((f) => (
          <FingerShape key={f.finger} from={f.knuckle} to={f.tip} on={false} />
        ))}
        <path d={palm} fill="var(--color-petal)" stroke="var(--color-rose)" strokeWidth={2.5} strokeLinejoin="round" />
        <rect
          x={Math.min(wristIn, wristOut) - 6}
          y={wristY - 8}
          width={Math.abs(wristIn - wristOut) + 12}
          height={22}
          rx={11}
          fill="var(--color-blush)"
          stroke="var(--color-rose)"
          strokeWidth={2}
        />
        <path
          d={`M${heart.x} ${heart.y} c -7 -9, -18 -2, -11 7 l 11 10 l 11 -10 c 7 -9, -4 -16, -11 -7 Z`}
          fill="var(--color-blush)"
          stroke="var(--color-rose)"
          strokeWidth={1.5}
        />
      </g>
      {all
        .filter((f) => f.on)
        .map((f) => (
          <FingerShape key={f.finger} from={f.knuckle} to={f.tip} on />
        ))}
    </g>
  );
}

function FingerShape({ from, to, on }: { from: Point; to: Point; on: boolean }) {
  return (
    <g opacity={on ? 0.75 : 1}>
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={on ? 'var(--color-berry)' : 'var(--color-rose)'} strokeWidth={28} strokeLinecap="round" />
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={on ? 'var(--color-accent)' : 'var(--color-petal)'} strokeWidth={23} strokeLinecap="round" />
      <circle cx={to.x} cy={to.y + 3} r={6} fill="#FFFFFF" opacity={0.75} />
    </g>
  );
}
