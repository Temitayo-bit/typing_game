import { packs } from '../data/packs';
import type { Selection } from '../lib/modes';
import { selectionKey } from '../lib/modes';

const choices: { label: string; selection: Selection }[] = [
  { label: '15s', selection: { kind: 'time', seconds: 15 } },
  { label: '30s', selection: { kind: 'time', seconds: 30 } },
  { label: '60s', selection: { kind: 'time', seconds: 60 } },
  { label: '10 words', selection: { kind: 'words', count: 10 } },
  { label: '25 words', selection: { kind: 'words', count: 25 } },
  { label: '50 words', selection: { kind: 'words', count: 50 } },
];

type Props = { selected: Selection; onSelect: (s: Selection) => void };

export function ModeBar({ selected, onSelect }: Props) {
  const current = selectionKey(selected);
  return (
    <nav className="space-y-3" aria-label="Test mode">
      <div className="flex flex-wrap justify-center gap-2">
        {choices.map((c) => (
          <Chip key={c.label} active={selectionKey(c.selection) === current} onClick={() => onSelect(c.selection)}>
            {c.label}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {packs.map((p) => {
          const s: Selection = { kind: 'pack', packId: p.id };
          return (
            <Chip key={p.id} active={selectionKey(s) === current} onClick={() => onSelect(s)}>
              {p.emoji} {p.name}
            </Chip>
          );
        })}
      </div>
    </nav>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={(e) => {
        onClick();
        e.currentTarget.blur();
      }}
      aria-pressed={active}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active ? 'bg-blush-400 text-white shadow' : 'bg-white/70 text-blush-600 hover:bg-blush-100'
      }`}
    >
      {children}
    </button>
  );
}
