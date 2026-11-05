import { useRef, useState } from 'react';
import { exportResults, importResults, type SavedResult } from '../lib/history';
import { isLessonKey } from '../lib/modes';
import { dayStreak, topMissedKeys } from '../lib/progress';

type Props = { results: SavedResult[]; onImported: () => void };

export function ProgressPanel({ results, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const streak = dayStreak(results);
  const best = results.filter((r) => !isLessonKey(r.mode)).reduce((m, r) => Math.max(m, r.wpm), 0);
  const missed = topMissedKeys(results);

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
    <section className="rounded-3xl bg-white/60 p-5 text-sm">
      <div className="grid grid-cols-3 gap-4 text-center">
        <Tile label="day streak" value={streak > 0 ? `${streak} 🔥` : '0'} />
        <Tile label="best wpm" value={best} />
        <Tile label="tests done" value={results.length} />
      </div>
      {missed.length > 0 && (
        <p className="mt-4 text-center">
          <span className="text-blush-700">trickiest keys so far: </span>
          {missed.map(([k]) => (
            <kbd key={k} className="mx-1 rounded-lg bg-blush-100 px-2 py-0.5 font-mono">{k === ' ' ? 'space' : k}</kbd>
          ))}
        </p>
      )}
      <div className="mt-4 flex justify-center gap-3 text-blush-600">
        <button className="underline-offset-4 hover:underline" onClick={download}>save my progress</button>
        <span aria-hidden>·</span>
        <button className="underline-offset-4 hover:underline" onClick={() => fileRef.current?.click()}>load progress</button>
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
      </div>
      {message && <p className="mt-2 text-center text-blush-700">{message}</p>}
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-2xl font-bold text-blush-600">{value}</div>
      <div className="text-blush-700/80">{label}</div>
    </div>
  );
}
