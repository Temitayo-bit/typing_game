import { fingerColor, homeKey, type Finger } from '../data/fingers';

type Side = 'left' | 'right';
type Digit = 'pinky' | 'ring' | 'middle' | 'index';

// Left hand seen from above, palm down; the right hand is the same drawing mirrored.
const digits: { digit: Digit; x: number; base: number; length: number; width: number; tilt: number }[] = [
  { digit: 'pinky', x: 34, base: 122, length: 62, width: 24, tilt: -14 },
  { digit: 'ring', x: 64, base: 112, length: 84, width: 26, tilt: -6 },
  { digit: 'middle', x: 96, base: 110, length: 94, width: 27, tilt: 0 },
  { digit: 'index', x: 128, base: 114, length: 82, width: 27, tilt: 7 },
];

/** `reach` is the key the active finger is moving to; other fingertips show the key they rest on. */
type Props = { active: readonly Finger[]; reach?: string };

export function Hands({ active, reach }: Props) {
  return (
    <div className="mt-3 flex items-end justify-center gap-16">
      <Hand side="left" active={active} reach={reach} />
      <Hand side="right" active={active} reach={reach} />
    </div>
  );
}

function Hand({ side, active, reach }: { side: Side; reach?: string } & Props) {
  const mirror = side === 'right' ? 'translate(200 0) scale(-1 1)' : undefined;
  const thumbOn = active.includes('thumb');
  return (
    <svg viewBox="0 0 200 200" className="h-40 w-auto overflow-visible" role="img" aria-label={`${side} hand`}>
      <g transform={mirror}>
        {digits.map((d) => {
          const finger: Finger = `${side} ${d.digit}`;
          const on = active.includes(finger);
          // The shift pinky keeps its home label; it is holding shift, not reaching.
          const label = on && reach && active[0] === finger ? reach : homeKey[finger];
          return <FingerShape key={d.digit} {...d} on={on} color={fingerColor[finger]} label={label} mirrored={side === 'right'} />;
        })}
        <FingerShape x={136} base={172} length={62} width={28} tilt={60} on={thumbOn} color={fingerColor.thumb} mirrored={side === 'right'} />
        <path
          d="M24 130 C 22 110, 42 104, 62 106 L 138 108 C 158 110, 166 128, 162 152 C 158 180, 138 194, 96 194 C 54 194, 28 178, 24 152 Z"
          fill="var(--color-petal)"
          stroke="var(--color-rose)"
          strokeWidth="2.5"
        />
        {/* Little heart on the back of each hand. */}
        <path
          d="M94 158 c -8 -10, -20 -2, -12 8 l 12 11 l 12 -11 c 8 -10, -4 -18, -12 -8 Z"
          fill="var(--color-blush)"
          stroke="var(--color-rose)"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}

type FingerProps = {
  x: number; base: number; length: number; width: number; tilt: number;
  on: boolean; color: string; label?: string; mirrored: boolean;
};

function FingerShape({ x, base, length, width, tilt, on, color, label, mirrored }: FingerProps) {
  const top = base - length;
  return (
    // CSS transform would replace the rotate attribute, so the lift lives on an inner group.
    <g transform={`rotate(${tilt} ${x} ${base})`}>
      <g style={{ transform: on ? 'translateY(-8px)' : undefined, transition: 'transform 120ms ease-out' }}>
      <rect
        x={x - width / 2}
        y={top}
        width={width}
        height={length + 24}
        rx={width / 2}
        fill={on ? 'var(--color-accent)' : color}
        stroke={on ? 'var(--color-berry)' : 'var(--color-rose)'}
        strokeWidth="2.5"
      />
      <rect x={x - width / 4} y={top + 5} width={width / 2} height={width / 2.2} rx={width / 5} fill="#FFFFFF" opacity={on ? 0.85 : 0.6} />
      {label && (
        <text
          x={x}
          y={top + 5 + width / 4}
          textAnchor="middle"
          dominantBaseline="central"
          // Un-mirror the letter on the right hand so it reads the right way round.
          transform={mirrored ? `translate(${2 * x} 0) scale(-1 1)` : undefined}
          className="font-mono"
          fontSize="12"
          fontWeight="700"
          fill={on ? 'var(--color-wine)' : 'var(--color-ink)'}
        >
          {label}
        </text>
      )}
      {on && (
        <path
          d={`M${x} ${top - 8} c -4 -6, -12 -1, -7 5 l 7 6 l 7 -6 c 5 -6, -3 -11, -7 -5 Z`}
          fill="var(--color-accent)"
        />
      )}
      </g>
    </g>
  );
}
