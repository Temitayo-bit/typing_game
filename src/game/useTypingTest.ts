import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { createTest, extendTargets, reduce, type Action, type Mode, type TestState } from './engine';
import { computeResult, type Result } from './stats';

type Clock = { startedAt: number | null; pausedAt: number | null; pausedTotal: number };

type Internal = { test: TestState; result: Result | null };

type InternalAction =
  | { type: 'engine'; action: Action; elapsed: number }
  | { type: 'reset'; test: TestState }
  | { type: 'extend'; more: string[] };

function internalReducer(state: Internal, a: InternalAction): Internal {
  switch (a.type) {
    case 'reset':
      return { test: a.test, result: null };
    case 'extend':
      return { ...state, test: extendTargets(state.test, a.more) };
    case 'engine': {
      const test = reduce(state.test, a.action);
      const justFinished = test.status === 'finished' && state.test.status !== 'finished';
      return { test, result: justFinished ? computeResult(test, a.elapsed) : state.result };
    }
  }
}

export type TypingTest = {
  test: TestState;
  result: Result | null;
  elapsedMs: number;
  paused: boolean;
  capsLock: boolean;
  restart: () => void;
  /** Starts again with exactly the same text */
  retry: () => void;
};

const INITIAL_WORDS = 60;
const EXTEND_WHEN_LEFT = 20;

/**
 * Drives one typing test from keyboard events. `makeWords` is called for the
 * initial text (fixed-length sources ignore the count) and, in time mode, whenever the text is about to run out.
 */
export function useTypingTest(mode: Mode, makeWords: (count: number) => string[]): TypingTest {
  const [state, dispatch] = useReducer(internalReducer, undefined, () => ({
    test: createTest(mode, makeWords(INITIAL_WORDS)),
    result: null,
  }));
  const clock = useRef<Clock>({ startedAt: null, pausedAt: null, pausedTotal: 0 });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const elapsed = useCallback((now: number) => {
    const c = clock.current;
    if (c.startedAt === null) return 0;
    const pausedNow = c.pausedAt === null ? 0 : now - c.pausedAt;
    return now - c.startedAt - c.pausedTotal - pausedNow;
  }, []);

  const startWith = useCallback(
    (words: string[]) => {
      clock.current = { startedAt: null, pausedAt: null, pausedTotal: 0 };
      setElapsedMs(0);
      setPaused(false);
      dispatch({ type: 'reset', test: createTest(mode, words) });
    },
    [mode],
  );
  const restart = useCallback(() => startWith(makeWords(INITIAL_WORDS)), [startWith, makeWords]);
  const targets0 = state.test.targets;
  const retry = useCallback(() => startWith(targets0), [startWith, targets0]);

  const { status } = state.test;

  useEffect(() => {
    if (status !== 'running' || paused) return;
    const id = window.setInterval(() => {
      const ms = elapsed(performance.now());
      setElapsedMs(ms);
      if (mode.kind === 'time' && ms >= mode.seconds * 1000) {
        dispatch({ type: 'engine', action: { type: 'finish' }, elapsed: mode.seconds * 1000 });
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [status, paused, mode, elapsed]);

  const { targets, wordIndex } = state.test;
  useEffect(() => {
    if (mode.kind === 'time' && targets.length - wordIndex < EXTEND_WHEN_LEFT) {
      dispatch({ type: 'extend', more: makeWords(40) });
    }
  }, [mode.kind, targets.length, wordIndex, makeWords]);

  useEffect(() => {
    function pause() {
      const c = clock.current;
      if (c.startedAt !== null && c.pausedAt === null && status === 'running') {
        c.pausedAt = performance.now();
        setPaused(true);
      }
    }
    window.addEventListener('blur', pause);
    return () => window.removeEventListener('blur', pause);
  }, [status]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      setCapsLock(e.getModifierState?.('CapsLock') ?? false);
      if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault();
        restart();
        return;
      }
      const altGr = e.getModifierState?.('AltGraph') ?? false;
      if ((!altGr && (e.ctrlKey || e.altKey)) || e.metaKey || e.isComposing) return;
      const isChar = e.key.length === 1;
      if (!isChar && e.key !== 'Backspace') return;
      if (status === 'finished') return;
      e.preventDefault();
      // The clock starts with the first letter, not a stray space or backspace.
      if (status === 'ready' && (e.key === ' ' || e.key === 'Backspace')) return;

      const now = performance.now();
      const c = clock.current;
      if (c.startedAt === null) c.startedAt = now;
      if (c.pausedAt !== null) {
        c.pausedTotal += now - c.pausedAt;
        c.pausedAt = null;
        setPaused(false);
      }
      const t = elapsed(now);
      if (mode.kind === 'time' && t >= mode.seconds * 1000) {
        dispatch({ type: 'engine', action: { type: 'finish' }, elapsed: mode.seconds * 1000 });
        return;
      }
      const action: Action = isChar ? { type: 'char', char: e.key, t } : { type: 'backspace', t };
      dispatch({ type: 'engine', action, elapsed: t });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [status, restart, elapsed, mode]);

  return { test: state.test, result: state.result, elapsedMs, paused, capsLock, restart, retry };
}
