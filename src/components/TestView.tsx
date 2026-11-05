import { useEffect, useRef, useState } from 'react';
import type { Mode, Rules, TestState } from '../game/engine';
import type { Result } from '../game/stats';
import { correctChars, wordsPerMinute } from '../game/stats';
import { useTypingTest } from '../game/useTypingTest';
import { keyLabel } from '../lib/format';
import { musicOnScreen, playFinish, playKey } from '../lib/sound';
import { KeyboardGuide } from './KeyboardGuide';
import { ResultCard, type LessonOutcome } from './ResultCard';
import { SoundToggle } from './SoundToggle';
import { Kbd } from './ui';
import { WordsView } from './WordsView';

type Props = {
  mode: Mode;
  rules?: Rules;
  modeLabel: string;
  makeWords: (count: number) => string[];
  previousBest: number | undefined;
  /** `typed` is the text of every word she reached. */
  onFinish: (result: Result, typed: string[]) => void;
  /** Shows the on-screen keyboard; lessons also dim keys not learned yet. */
  guide?: { unlocked?: ReadonlySet<string>; fresh?: readonly string[] };
  lessonOutcome?: (result: Result) => LessonOutcome;
  onNextLesson?: () => void;
  onDrillKeys?: (keys: string[]) => void;
};

export function TestView(props: Props) {
  const { mode, rules, makeWords, previousBest, onFinish, guide, lessonOutcome } = props;
  const { test, result, elapsedMs, paused, capsLock, restart, retry } = useTypingTest(mode, makeWords, rules);
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
      onFinish(result, test.targets.slice(0, test.typed.length));
    }
  }, [result, onFinish, lessonOutcome, previousBest, test.targets, test.typed.length]);

  useEffect(musicOnScreen, []);

  const last = test.keystrokes.at(-1);
  useEffect(() => {
    if (last) playKey(last.correct);
  }, [last]);

  if (result) {
    const next = outcome?.passed === true && outcome.hasNext && props.onNextLesson ? props.onNextLesson : restart;
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
        {rules?.noBackspace && test.status === 'running' && <p className="mt-2 text-muted">backspace is off for this one, just keep going</p>}
        {paused && <p className="mt-2 font-bold text-berry">paused, press any key to carry on</p>}
        {test.status === 'running' && mode.kind === 'text' && test.wordIndex === test.targets.length - 1 &&
          (test.typed[test.wordIndex] ?? '').length >= (test.targets[test.wordIndex] ?? '').length && (
            <p className="mt-2 text-muted">press space to finish</p>
          )}
        {rules?.stopOnError && last && !last.correct && last.expected !== null && test.status === 'running' && (
          <p className="mt-2 font-bold text-berry">not quite, find {keyLabel(last.expected)}</p>
        )}
        {capsLock && <p className="mt-2 font-bold text-error">caps lock is on</p>}
      </div>
      {guide && <KeyboardGuide nextChar={nextChar(test)} unlocked={guide.unlocked} fresh={guide.fresh} resting={test.status === 'ready'} />}
      <p className="text-center text-sm text-muted">
        <Kbd>esc</Kbd> to restart
      </p>
      <p className="text-center text-sm text-muted sm:hidden">
        Typing practice needs a real keyboard, so this works best on a laptop.
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
