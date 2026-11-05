import { useCallback, useMemo } from 'react';
import { TestView } from '../components/TestView';
import type { LessonOutcome } from '../components/ResultCard';
import type { Result } from '../game/stats';
import { wordSource } from '../game/sources';
import type { SavedResult } from '../lib/history';
import { engineMode, modeLabel, selectionKey, type ModeKey, type Selection } from '../lib/modes';
import { personalBest, type StepRef } from '../lib/progress';

type Props = {
  selection: Selection;
  results: SavedResult[];
  unlocked: StepRef;
  onFinish: (key: ModeKey, r: Result) => void;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const makeWords = useMemo(() => wordSource(selection, unlocked), [instance]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mode = useMemo(() => engineMode(selection), [key]);
  const finish = useCallback((r: Result) => onFinish(key, r), [key, onFinish]);
  return (
    <TestView
      key={instance}
      mode={mode}
      modeLabel={modeLabel(key)}
      makeWords={makeWords}
      previousBest={personalBest(results, key)?.wpm}
      onFinish={finish}
      guide={guide ?? (showKeyboard ? {} : undefined)}
      {...rest}
    />
  );
}
