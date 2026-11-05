import { useEffect, useRef, useState } from 'react';
import { notes, noteUnlocked, unlockHint } from '../data/notes';
import type { Result } from '../game/stats';
import type { SavedResult } from '../lib/history';
import type { ModeKey } from '../lib/modes';
import { dayStreak, longestStreak, personalBest, type StepRef } from '../lib/progress';
import { Card, Heart } from '../components/ui';
import { Practice } from './Practice';

type Props = { results: SavedResult[]; unlocked: StepRef; onFinish: (key: ModeKey, r: Result, textKeys?: string[]) => void };

export function NotesPage({ results, unlocked, onFinish }: Props) {
  const stats = { streak: dayStreak(results), longestStreak: longestStreak(results), tests: results.length };
  const [typing, setTyping] = useState<string | null>(null);
  const practiceRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typing) practiceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [typing]);
  const note = notes.find((n) => n.id === typing);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0 font-display text-[40px] font-semibold">Notes from me to you</h1>
        <p className="m-0 mt-1 text-[17px] text-muted">Type one out and it is yours to keep. More open up as you practise.</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {notes.map((n) => {
          const open = noteUnlocked(n, stats);
          const best = personalBest(results, `note-${n.id}`);
          return (
            <button
              key={n.id}
              disabled={!open}
              onClick={(e) => {
                setTyping(n.id);
                e.currentTarget.blur();
              }}
              className={`flex min-h-45 flex-col gap-3 rounded-3xl border border-line p-5 text-left ${
                !open ? 'cursor-not-allowed bg-[#FBE6EE]' : best ? 'bg-white' : 'bg-blush'
              } ${typing === n.id ? 'ring-2 ring-accent' : ''}`}
            >
              <span className="flex items-center justify-between">
                <span className="text-[13px] font-bold tracking-[0.06em] text-wine uppercase">{open ? n.tag : 'Locked'}</span>
                <Heart size={20} color={open ? (best ? '#F06A9B' : '#B0124F') : '#E4B5C7'} />
              </span>
              <span className="flex-1 text-[17px] leading-normal">{open ? n.text : unlockHint(n, stats)}</span>
              <span className="text-sm font-bold text-berry">
                {!open ? '' : best ? `Typed · ${Math.round(best.wpm)} wpm` : 'Type this one'}
              </span>
            </button>
          );
        })}
      </div>
      {note && (
        <div ref={practiceRef}>
        <Card className="flex flex-col gap-4">
          <span className="font-bold">Typing: "{note.tag}"</span>
          <Practice selection={{ kind: 'note', noteId: note.id }} results={results} unlocked={unlocked} onFinish={onFinish} />
        </Card>
        </div>
      )}
    </div>
  );
}
