import { useEffect, useRef, useState } from 'react';
import type { Mode, TestState } from '../game/engine';
import type { Result } from '../game/stats';
import { correctChars, wordsPerMinute } from '../game/stats';
import { useTypingTest } from '../game/useTypingTest';
import { playFinish, playKey } from '../lib/sound';
import { KeyboardGuide } from './KeyboardGuide';
import { ResultCard, type LessonOutcome } from './ResultCard';
import { SoundToggle } from './SoundToggle';
import { Kbd } from './ui';
import { WordsView } from './WordsView';

type Props = {
  mode: Mode;
  modeLabel: string;
  makeWords: (count: number) => string[];
  previousBest: number | undefined;
  onFinish: (result: Result) => void;
  /** Shows the on-screen keyboard; lessons also dim keys not learned yet. */
  guide?: { unlocked?: ReadonlySet<string>; fresh?: readonly string[] };
  lessonOutcome?: (result: Result) => LessonOutcome;
  onNextLesson?: () => void;
  onDrillKeys?: (keys: string[]) => void;
};

export function TestView(props: Props) {
  const { mode, makeWords, previousBest, onFinish, guide, lessonOutcome } = props;
  const { test, result, elapsedMs, paused, capsLock, restart, retry } = useTypingTest(mode, makeWords);
  const reported = useRef<Result | null>(null);
  // Saving the result updates previousBest, so remember the best from before this run.
  const [bestBefore, setBestBefore] = useState(previousBest);
  const [outcome, setOutcome] = useState<LessonOutcome | undefined>();

  useEffect(() => {
    if (result && reported.current !== result) {
      reported.current = result;
      setBestBefore(previousBest);
      const lesson = lessonOutcome?.(result);
      setOutcome(lesson);
      playFinish(lesson ? lesson.passed : previousBest !== undefined && result.wpm > previousBest);
      onFinish(result);
    }
  }, [result, onFinish, lessonOutcome, previousBest]);

  const last = test.keystrokes.at(-1);
  useEffect(() => {
    if (last) playKey(last.correct);
  }, [last]);

  if (result) {
    const next = outcome?.passed && outcome.hasNext && props.onNextLesson ? props.onNextLesson : restart;
    return (
      <ResultCard
        result={result}
        modeLabel={props.modeLabel}
        previousBest={bestBefore}
        lesson={outcome}
        onNext={next}
        onRetry={retry}
        onDrillKeys={props.onDrillKeys}
      />
    );
  }

  const liveWpm = Math.round(wordsPerMinute(correctChars(test), elapsedMs));
  const liveAccuracy = accuracy(test);
  const progress =
    mode.kind === 'time'
      ? formatClock(Math.max(0, mode.seconds * 1000 - elapsedMs))
      : `${test.wordIndex}/${test.targets.length}`;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4 font-display">
        <div className="flex flex-wrap items-baseline gap-10">
          <span className="text-[44px] font-semibold text-berry">{progress}</span>
          <span>
            <span className="text-[32px] font-semibold">{test.status === 'running' && elapsedMs >= 2000 ? liveWpm : '–'}</span>{' '}
            <span className="font-sans text-base text-muted">wpm</span>
          </span>
          <span>
            <span className="text-[32px] font-semibold">{liveAccuracy === null ? '–' : `${liveAccuracy}%`}</span>{' '}
            <span className="font-sans text-base text-muted">accuracy</span>
          </span>
        </div>
        <SoundToggle />
      </div>
      <div className="relative">
        <WordsView test={test} faded={paused} />
        {test.status === 'ready' && <p className="mt-2 text-muted">start typing whenever you're ready</p>}
        {paused && <p className="mt-2 font-bold text-berry">paused, press any key to carry on</p>}
        {capsLock && <p className="mt-2 font-bold text-error">caps lock is on</p>}
      </div>
      {guide && <KeyboardGuide nextChar={nextChar(test)} unlocked={guide.unlocked} fresh={guide.fresh} />}
      <p className="text-center text-sm text-muted">
        <Kbd>tab</Kbd> or <Kbd>esc</Kbd> to restart
      </p>
    </section>
  );
}

function nextChar(test: TestState): string | undefined {
  const target = test.targets[test.wordIndex] ?? '';
  const typed = test.typed[test.wordIndex] ?? '';
  if (typed.length < target.length) return target[typed.length];
  return test.wordIndex < test.targets.length - 1 ? ' ' : undefined;
}

function accuracy(test: TestState): number | null {
  if (test.keystrokes.length === 0) return null;
  return Math.round((test.keystrokes.filter((k) => k.correct).length / test.keystrokes.length) * 100);
}

function formatClock(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
