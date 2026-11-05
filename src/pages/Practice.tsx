import { useCallback, useMemo } from 'react';
import { TestView } from '../components/TestView';
import type { LessonOutcome } from '../components/ResultCard';
import type { Result } from '../game/stats';
import { wordSource } from '../game/sources';
import type { SavedResult } from '../lib/history';
import { passagesIn, seenTexts } from '../lib/seen';
import { engineMode, modeLabel, selectionKey, testRules, type ModeKey, type Selection } from '../lib/modes';
import { personalBest, topMissedKeys, type StepRef } from '../lib/progress';

type Props = {
  selection: Selection;
  results: SavedResult[];
  unlocked: StepRef;
  onFinish: (key: ModeKey, r: Result, textKeys?: string[]) => void;
  showKeyboard?: boolean;
  guide?: { unlocked?: ReadonlySet<string>; fresh?: readonly string[] };
  lessonOutcome?: (r: Result) => LessonOutcome;
  onNextLesson?: () => void;
  onDrillKeys?: (keys: string[]) => void;
};

/** One test for a selection; remounts whenever the selection changes. */
export function Practice({ selection, results, unlocked, onFinish, showKeyboard, guide, ...rest }: Props) {
  const key = selectionKey(selection);
  // Weak drills share one saved mode key, so the drilled keys also decide when to rebuild.
  const instance = selection.kind === 'weak' ? `${key}:${selection.keys.join('')}` : key;
  // The word source is fixed per selection so a running test is never swapped out.
  // Passages typed before wait their turn; this set grows as tests finish, so "Next test" sees it too.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const seen = useMemo(() => seenTexts(results), [instance]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const makeWords = useMemo(() => wordSource(selection, unlocked, Math.random, topMissedKeys(results).map(([k]) => k), seen), [instance]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mode = useMemo(() => engineMode(selection), [key]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rules = useMemo(() => testRules(selection), [key]);
  const finish = useCallback(
    (r: Result, typed: string[]) => {
      const textKeys = passagesIn(typed);
      for (const k of textKeys) seen.add(k);
      onFinish(key, r, textKeys);
    },
    [key, onFinish, seen],
  );
  return (
    <TestView
      key={instance}
      mode={mode}
      rules={rules}
      modeLabel={modeLabel(key)}
      makeWords={makeWords}
      previousBest={personalBest(results, key)?.wpm}
      onFinish={finish}
      guide={guide ?? (showKeyboard ? {} : undefined)}
      {...rest}
    />
  );
}
