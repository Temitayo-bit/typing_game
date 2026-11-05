import { keysUpTo } from '../data/lessons';
import { packs } from '../data/packs';
import type { Result } from '../game/stats';
import { practiceLevel } from '../game/sources';
import type { Selection } from '../lib/modes';
import { selectionKey } from '../lib/modes';
import type { StepRef } from '../lib/progress';
import { Practice } from './Practice';
import type { SavedResult } from '../lib/history';

type Props = {
  selection: Selection;
  setSelection: (s: Selection) => void;
  results: SavedResult[];
  unlocked: StepRef;
  onFinish: (key: ReturnType<typeof selectionKey>, r: Result) => void;
};

const times = [15, 30, 60];
const counts = [10, 25, 50];

export function PracticePage({ selection, setSelection, results, unlocked, onFinish }: Props) {
  const level = practiceLevel(unlocked);
  const current = selectionKey(selection);
  const usesLevel = selection.kind === 'time' || selection.kind === 'words';
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-center gap-2 self-center rounded-[28px] border border-line bg-white px-3 py-2 text-[15px] font-bold">
        <span className="px-3 py-2 text-muted">time</span>
        {times.map((s) => (
          <Pill key={s} active={current === `time-${s}`} onClick={() => setSelection({ kind: 'time', seconds: s })}>
            {s}
          </Pill>
        ))}
        <span className="h-6 w-px bg-line" />
        <span className="px-3 py-2 text-muted">words</span>
        {counts.map((c) => (
          <Pill key={c} active={current === `words-${c}`} onClick={() => setSelection({ kind: 'words', count: c })}>
            {c}
          </Pill>
        ))}
        <span className="h-6 w-px bg-line" />
        <label className="flex items-center gap-2 px-2">
          <span className="text-muted">pack</span>
          <select
            className="min-h-11 rounded-full bg-petal px-3 text-wine"
            value={selection.kind === 'pack' ? selection.packId : ''}
            onChange={(e) => e.target.value && setSelection({ kind: 'pack', packId: e.target.value })}
          >
            <option value="">choose…</option>
            {packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {usesLevel && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-petal px-5 py-3 text-sm text-wine">
          <span className="font-bold">Practice level: {level.letters ? 'Beginner' : 'All keys'}</span>
          <span>
            {level.letters
              ? `uses only the keys you've learned so far (${[...level.letters].join(' ')}), and grows as you finish lessons`
              : 'you know every letter, so tests use all the words'}
          </span>
        </div>
      )}
      {selection.kind === 'weak' && (
        <div className="rounded-2xl bg-petal px-5 py-3 text-sm font-bold text-wine">Quick drill on: {selection.keys.join(' ')}</div>
      )}
      <Practice
        selection={selection}
        results={results}
        unlocked={unlocked}
        onFinish={onFinish}
        guide={level.letters ? { unlocked: keysUpTo(unlocked.lessonId) } : undefined}
        onDrillKeys={(keys) => setSelection({ kind: 'weak', keys })}
      />
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-pressed={active}
      onClick={(e) => {
        onClick();
        e.currentTarget.blur();
      }}
      className={`min-h-11 rounded-full px-4 py-2.5 ${active ? 'bg-accent text-white' : 'text-muted hover:bg-cream'}`}
    >
      {children}
    </button>
  );
}
