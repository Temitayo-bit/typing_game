import { lessons } from '../data/lessons';
import { packs } from '../data/packs';
import type { SavedResult } from '../lib/history';
import type { Selection } from '../lib/modes';
import { isSpeedTest } from '../lib/modes';
import { dayStreak, lessonStatus, personalBest, type StepRef } from '../lib/progress';
import type { Route } from '../lib/route';
import { Button, Card } from '../components/ui';

type Props = {
  results: SavedResult[];
  unlocked: StepRef;
  go: (r: Route) => void;
  practise: (s: Selection) => void;
  name: string;
};

export function HomePage({ results, unlocked, go, practise, name }: Props) {
  const streak = dayStreak(results);
  const best30 = personalBest(results, 'time-30')?.wpm;
  const speedTests = results.filter((r) => isSpeedTest(r.mode));
  const avgAccuracy = speedTests.length ? Math.round(speedTests.reduce((s, r) => s + r.accuracy, 0) / speedTests.length) : undefined;
  const lessonsDone = lessons.filter((l) => lessonStatus(results, l.id, unlocked).state === 'done').length;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-stretch gap-6">
        <Card className="flex min-w-0 flex-[999_1_520px] flex-col gap-4 sm:p-10">
          <div className="text-[15px] font-bold tracking-[0.08em] text-berry uppercase">{greetingTime()}</div>
          <h1 className="m-0 font-display text-4xl leading-tight font-semibold sm:text-[52px]">Hi {name}, ready to type something sweet?</h1>
          <p className="m-0 max-w-xl text-lg leading-normal text-muted">
            Ten minutes a day is all it takes. Pick up where you left off, or jump into a quick test.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button onClick={() => go({ page: 'lesson', lessonId: unlocked.lessonId })}>Continue lesson {unlocked.lessonId}</Button>
            <Button kind="soft" onClick={() => practise({ kind: 'time', seconds: 30 })}>
              Start a 30s test
            </Button>
          </div>
        </Card>
        <div className="flex flex-[1_1_280px] flex-col gap-4">
          <div className="flex items-center gap-4 rounded-3xl bg-blush p-6">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#B0124F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s0 2 2 2c0-3-1-5 1-8z" />
            </svg>
            <div>
              <div className="font-display text-[34px] font-semibold">
                {streak} day{streak === 1 ? '' : 's'}
              </div>
              <div className="text-[15px] text-muted">{streak > 0 ? 'streak, keep it going' : 'practise today to start a streak'}</div>
            </div>
          </div>
          <Card className="grid grid-cols-2 gap-4 sm:p-6">
            <Tile label="Best (30s)" value={best30 === undefined ? '–' : `${Math.round(best30)} wpm`} />
            <Tile label="Accuracy" value={avgAccuracy === undefined ? '–' : `${avgAccuracy}%`} />
            <Tile label="Tests" value={results.length} />
            <Tile label="Lessons" value={`${lessonsDone} / ${lessons.length}`} />
          </Card>
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="m-0 font-display text-[26px] font-semibold">Pick a pack</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {packs.map((p) => (
            <button
              key={p.id}
              onClick={() => practise({ kind: 'pack', packId: p.id })}
              className="flex min-h-30 flex-col gap-2 rounded-[22px] border border-line bg-white p-5 text-left transition hover:border-rose"
            >
              <span className="h-9 w-9 rounded-xl" style={{ background: p.tint }} />
              <span className="text-[17px] font-bold">{p.name}</span>
              <span className="text-sm leading-snug text-muted">{p.blurb}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-sm text-muted">{label}</div>
      <div className="font-display text-[28px] font-semibold">{value}</div>
    </div>
  );
}

function greetingTime(now = new Date()): string {
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const h = now.getHours();
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  return `${day} ${part}`;
}
