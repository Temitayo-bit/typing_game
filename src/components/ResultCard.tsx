import { useState } from 'react';
import { cheers } from '../data/notes';
import { PASS_ACCURACY } from '../data/lessons';
import type { Result } from '../game/stats';
import { keyLabel } from '../lib/format';
import { Button, Card } from './ui';
import { LineChart } from './LineChart';

/** `message` and `nextLabel` let exams speak for themselves instead of using the practice wording. */
export type LessonOutcome = ({ passed: true; hasNext: boolean } | { passed: false; tooShort?: boolean }) & { message?: string; nextLabel?: string };

type Props = {
  result: Result;
  modeLabel: string;
  previousBest: number | undefined;
  lesson?: LessonOutcome;
  onNext: () => void;
  onRetry: () => void;
  onDrillKeys?: (keys: string[]) => void;
};

export function ResultCard({ result, modeLabel, previousBest, lesson, onNext, onRetry, onDrillKeys }: Props) {
  const [cheer] = useState(() => cheers[Math.floor(Math.random() * cheers.length)]!);
  const newBest = !lesson && previousBest !== undefined && result.wpm > previousBest;
  const missed = Object.entries(result.missedKeys).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const banner = lesson?.message
    ? lesson.message
    : lesson
    ? lesson.passed
      ? lesson.hasNext ? 'Practice passed! The next one is unlocked.' : 'You finished every lesson. You can touch type now!'
      : lesson.tooShort
        ? 'Keep typing until the clock runs out, a few more words and it counts.'
        : `So close. ${PASS_ACCURACY}% accuracy unlocks the next one, speed doesn't matter yet.`
    : newBest
      ? `New personal best for ${modeLabel}! Look at you go.`
      : null;

  return (
    <section className="flex flex-col gap-6" aria-live="polite">
      {banner && (
        <div className={`rounded-[22px] px-6 py-4 text-lg font-bold ${lesson && !lesson.passed ? 'bg-petal text-wine' : 'bg-accent text-white'}`}>
          {banner}
        </div>
      )}
      <div className="flex flex-wrap gap-6">
        <Card className="flex flex-[1_1_240px] flex-col gap-5">
          <Big label="wpm" value={result.wpm} size="text-[80px]" accent />
          <Big label="accuracy" value={`${Math.round(result.accuracy)}%`} size="text-5xl" />
          <div className="grid grid-cols-3 gap-3 text-sm text-muted">
            <Small label="raw" value={Math.round(result.rawWpm)} />
            <Small label="chars" value={`${result.correctChars}/${result.typedChars - result.correctChars}`} />
            <Small label="mode" value={modeLabel} />
          </div>
        </Card>
        <Card className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
          <div className="font-bold">Speed over the test</div>
          <LineChart points={result.wpmBySecond.length > 3 ? result.wpmBySecond.slice(1) : result.wpmBySecond} label="Words per minute through the test" xLabel={`${result.wpmBySecond.length}s`} />
        </Card>
      </div>
      <div className="flex flex-wrap gap-6">
        <Card className="flex flex-[1_1_320px] flex-col gap-3">
          <div className="font-bold">Keys that tripped you up</div>
          {missed.length === 0 ? (
            <p className="text-muted">none at all, perfect run</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2.5 font-mono text-lg">
                {missed.map(([k, n]) => (
                  <span key={k} className="rounded-xl bg-petal px-3.5 py-2">
                    {keyLabel(k)} ×{n}
                  </span>
                ))}
              </div>
              {onDrillKeys && (
                <button className="self-start font-bold text-berry hover:text-wine" onClick={() => onDrillKeys(missed.map(([k]) => k))}>
                  Practise these in a quick drill
                </button>
              )}
            </>
          )}
        </Card>
        <div className="flex flex-[1_1_320px] flex-col gap-2 rounded-[28px] bg-blush p-6 sm:p-7">
          <div className="font-bold">A little note</div>
          <p className="text-[17px] leading-relaxed">{cheer}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onNext}>{nextLabel(lesson)}</Button>
        <Button kind="soft" onClick={onRetry}>
          Retry same text
        </Button>
        <span className="self-center text-sm text-muted">or press esc for new text</span>
      </div>
    </section>
  );
}

function nextLabel(lesson: LessonOutcome | undefined): string {
  if (!lesson) return 'Next test';
  if (lesson.nextLabel) return lesson.nextLabel;
  // A failed practice stays on the same step, so say so instead of promising the next one.
  if (!lesson.passed) return 'Try again';
  return lesson.hasNext ? 'Next practice' : 'Go again';
}

function Big({ label, value, size, accent }: { label: string; value: string | number; size: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[15px] text-muted">{label}</div>
      <div className={`font-display ${size} leading-none font-semibold ${accent ? 'text-berry' : ''}`}>{value}</div>
    </div>
  );
}

function Small({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      {label}
      <div className="text-[22px] font-bold text-ink">{value}</div>
    </div>
  );
}
