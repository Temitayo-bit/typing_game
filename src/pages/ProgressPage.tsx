import { LineChart } from '../components/LineChart';
import { Button, Card } from '../components/ui';
import { keyLabel } from '../lib/format';
import { exportResults, importResults, type SavedResult } from '../lib/history';
import { reachedMilestones } from '../lib/milestones';
import { isSpeedTest, type Selection } from '../lib/modes';
import { activityByDay, dayStreak, longestStreak, personalBest, topMissedKeys } from '../lib/progress';
import { useRef, useState } from 'react';

type Props = { results: SavedResult[]; practise: (s: Selection) => void; onImported: () => void };

export function ProgressPage({ results, practise, onImported }: Props) {
  const speed = results.filter((r) => isSpeedTest(r.mode));
  const recent = [...speed].sort((a, b) => a.finishedAt - b.finishedAt).slice(-30);
  const bests = new Set<number>();
  let running = 0;
  recent.forEach((r, i) => {
    if (r.wpm > running) {
      running = r.wpm;
      bests.add(i);
    }
  });
  const avgAccuracy = speed.length ? Math.round(speed.reduce((s, r) => s + r.accuracy, 0) / speed.length) : undefined;
  const minutes = Math.round(results.reduce((s, r) => s + r.durationMs, 0) / 60_000);
  const weak = topMissedKeys(results.slice(0, 40), 5);
  const days = activityByDay(results, 70);
  const milestones = reachedMilestones(results);

  const tiles = [
    { label: 'Best 30s', value: fmtWpm(personalBest(results, 'time-30')?.wpm) },
    { label: 'Best 50 words', value: fmtWpm(personalBest(results, 'words-50')?.wpm) },
    { label: 'Avg accuracy', value: avgAccuracy === undefined ? '–' : `${avgAccuracy}%` },
    { label: 'Time practised', value: minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : results.length > 0 && minutes === 0 ? '<1 min' : `${minutes} min` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 font-display text-[34px] font-semibold">Look how far you have come</h1>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-[22px] border border-line bg-white p-5">
            <div className="text-sm text-muted">{t.label}</div>
            <div className="font-display text-4xl font-semibold">{t.value}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-6">
        <Card className="flex min-w-0 flex-[999_1_520px] flex-col gap-2.5">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-bold">WPM, last {recent.length} tests</span>
            <span className="text-sm text-muted">dots are personal bests</span>
          </div>
          <LineChart points={recent.map((r) => r.wpm)} label="Words per minute over recent tests" xLabel="latest" highlight={(i) => bests.has(i)} />
        </Card>
        <Card className="flex flex-[1_1_300px] flex-col gap-3.5">
          <div className="flex items-baseline justify-between">
            <span className="font-bold">Streak</span>
            <span className="font-display text-[26px] font-semibold text-berry">{plural(dayStreak(results), 'day')}</span>
          </div>
          <div className="grid grid-cols-10 gap-1.5" role="img" aria-label="Practice days over the last 10 weeks">
            {days.map((n, i) => (
              <span key={i} className="aspect-square rounded-md" style={{ background: shade(n) }} />
            ))}
          </div>
          <div className="text-sm text-muted">Longest streak: {plural(longestStreak(results), 'day')}.</div>
        </Card>
      </div>
      <Card className="flex flex-wrap items-center gap-4">
        <span className="mr-2 font-bold">Weakest keys lately</span>
        {weak.length === 0 && <span className="text-muted">nothing yet, keep typing</span>}
        {weak.map(([k, n]) => (
          <span key={k} className="rounded-xl bg-petal px-3.5 py-2 font-mono">
            {keyLabel(k)} ×{n}
          </span>
        ))}
        {weak.length > 0 && (
          <span className="ml-auto">
            <Button onClick={() => practise({ kind: 'weak', keys: weak.map(([k]) => k) })}>Drill these</Button>
          </span>
        )}
      </Card>
      {milestones.length > 0 && (
        <Card className="flex flex-col gap-3">
          <span className="font-bold">Milestones</span>
          <div className="flex flex-wrap gap-2">
            {milestones.map((m) => (
              <span key={m.id} className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-wine">
                {m.title}
              </span>
            ))}
          </div>
        </Card>
      )}
      <Backup onImported={onImported} />
    </div>
  );
}

function Backup({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function download() {
    try {
      const blob = new Blob([await exportResults()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `typing-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(a);
      a.click();
      a.remove();
      // Revoking straight away can cancel the download in Safari and Firefox.
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      setMessage("couldn't read your progress from this browser");
    }
  }

  async function upload(file: File) {
    try {
      const n = await importResults(await file.text());
      setMessage(n === 0 ? 'nothing new in that file' : `added ${n} results`);
      onImported();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not import that file');
    }
  }

  return (
    <Card className="flex flex-wrap items-center gap-3">
      <span className="mr-auto font-bold">Back up your progress</span>
      <Button kind="soft" onClick={() => void download()}>
        Save to a file
      </Button>
      <Button kind="ghost" onClick={() => fileRef.current?.click()}>
        Load from a file
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = '';
        }}
      />
      {message && <p className="w-full text-sm text-wine" role="status">{message}</p>}
    </Card>
  );
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function fmtWpm(wpm: number | undefined): string {
  return wpm === undefined ? '–' : `${Math.round(wpm)} wpm`;
}

function shade(n: number): string {
  return n === 0 ? '#FBE6EE' : n < 3 ? '#FFB3CC' : n < 6 ? '#F06A9B' : '#B0124F';
}
