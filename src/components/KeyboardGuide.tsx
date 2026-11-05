import { fingerColor, fingerFor, fingersFor, homeKey, keyboardRows, keyFor, shiftHand } from '../data/fingers';
import { Hands } from './Hands';

const homeKeys = new Set(Object.values(homeKey));

type Props = {
  nextChar: string | undefined;
  unlocked?: ReadonlySet<string>;
  fresh?: readonly string[];
  /** Before the first key: show where her fingers should rest. */
  resting?: boolean;
};

export function KeyboardGuide({ nextChar, unlocked, fresh = [], resting = false }: Props) {
  const next = nextChar === undefined ? undefined : keyFor(nextChar);
  const finger = next ? fingerFor(next.key) : undefined;
  // Symbols live on Shift, so light up the key they are typed on.
  const freshKeys = fresh.map((c) => keyFor(c).key);
  const hint = resting
    ? 'rest your fingers on a s d f and j k l ; (feel the bumps on f and j), thumbs on space'
    : next && finger
      ? `${next.key === ' ' ? 'space' : nextChar}: ${finger === 'thumb' ? 'either thumb' : `${finger} finger`}${
          next.shift ? ` + ${shiftHand(next.key)} pinky on shift` : ''
        }`
      : '';
  return (
    <div className="hidden select-none flex-col items-center gap-1.5 overflow-hidden rounded-[20px] bg-cream p-4 sm:flex" aria-hidden="true">
      <p className="mb-1 h-5 text-sm text-muted">{hint}</p>
      {/* Bottom padding leaves room for the palms below the keys. */}
      <div className="relative flex flex-col items-center gap-1.5 pb-24">
        {keyboardRows.map((row, r) => (
          <div key={row} className="flex gap-1.5" style={{ paddingLeft: `${[0, 20, 32, 52][r]}px` }}>
            {[...row].map((k) => (
              <Key
                key={k}
                label={k}
                active={next?.key === k}
                fresh={freshKeys.includes(k)}
                locked={unlocked !== undefined && !unlocked.has(k)}
                home={resting && homeKeys.has(k)}
              />
            ))}
          </div>
        ))}
        <div className="mt-1 flex gap-1.5">
          <Key label="shift" id="shift-left" wide active={next?.shift === true && shiftHand(next.key) === 'left'} fresh={false} locked={false} />
          <Key label=" " space active={next?.key === ' '} fresh={false} locked={false} />
          <Key label="shift" id="shift-right" wide active={next?.shift === true && shiftHand(next.key) === 'right'} fresh={false} locked={false} />
        </div>
        <Hands active={resting || nextChar === undefined ? [] : fingersFor(nextChar)} target={next?.key} />
      </div>
    </div>
  );
}

type KeyProps = { label: string; id?: string; active: boolean; fresh: boolean; locked: boolean; home?: boolean; wide?: boolean; space?: boolean };

function Key({ label, id, active, fresh, locked, home, wide, space }: KeyProps) {
  const finger = fingerFor(label);
  const background = active ? 'var(--color-accent)' : locked ? '#FFFFFF' : fresh ? 'var(--color-blush)' : finger ? fingerColor[finger] : '#FFF0F5';
  const color = active ? '#FFFFFF' : locked ? '#E4B5C7' : '#3D1C2C';
  return (
    <div
      data-key={id ?? label}
      className={`relative flex h-11 items-center justify-center rounded-[10px] font-mono text-sm transition ${
        space ? 'w-72' : wide ? 'w-20' : 'w-11'
      }`}
      style={{ background, color, boxShadow: active ? '0 0 0 4px var(--color-blush)' : home ? '0 0 0 2.5px var(--color-accent)' : 'none' }}
    >
      {label === ' ' ? 'space' : label}
      {(label === 'f' || label === 'j') && <span className="absolute bottom-1.5 h-0.5 w-3 rounded bg-current opacity-50" />}
    </div>
  );
}
