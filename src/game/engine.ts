/** `time` runs for a fixed duration with endless words; `text` ends after the last word. */
import { netChars } from './net';

export type Mode = { kind: 'time'; seconds: number } | { kind: 'text' };

export type Keystroke = {
  /** ms since the test started */
  t: number;
  /** null when typed past the end of a word */
  expected: string | null;
  typed: string;
  correct: boolean;
};

export type Status = 'ready' | 'running' | 'finished';

/** Optional twists a practice can add on top of a mode. */
export type Rules = {
  noBackspace?: boolean;
  /** A wrong key is counted as a miss but the cursor stays put until the right key comes. */
  stopOnError?: boolean;
};

/** Invariant: typed.length === wordIndex + 1 (one entry per word reached). */
export type TestState = {
  status: Status;
  mode: Mode;
  rules: Rules;
  targets: string[];
  typed: string[];
  wordIndex: number;
  keystrokes: Keystroke[];
  /** Net correct characters after every keystroke, including backspaces; drives the speed chart */
  netTimeline: { t: number; net: number }[];
};

export type Action =
  | { type: 'char'; char: string; t: number }
  | { type: 'backspace'; t: number }
  | { type: 'finish' };

export function createTest(mode: Mode, targets: string[], rules: Rules = {}): TestState {
  if (targets.length === 0) throw new Error('A test needs at least one word');
  return { status: 'ready', mode, rules, targets, typed: [''], wordIndex: 0, keystrokes: [], netTimeline: [] };
}

export function reduce(state: TestState, action: Action): TestState {
  if (state.status === 'finished') return state;
  switch (action.type) {
    case 'char': {
      const next = action.char === ' ' ? space(state, action.t) : char(state, action.char, action.t);
      return snapshot(state, next, action.t);
    }
    case 'backspace':
      return snapshot(state, backspace(state), action.t);
    case 'finish':
      return { ...state, status: 'finished' };
  }
}

function snapshot(before: TestState, after: TestState, t: number): TestState {
  if (after === before) return before;
  const net = netChars(after.targets, after.typed, after.wordIndex);
  return { ...after, netTimeline: [...after.netTimeline, { t, net }] };
}

function char(state: TestState, c: string, t: number): TestState {
  const target = state.targets[state.wordIndex] ?? '';
  const current = state.typed[state.wordIndex] ?? '';
  const expected = target[current.length] ?? null;
  if (state.rules.stopOnError && c !== expected) {
    // At the end of a word the right key is space.
    const want = expected ?? ' ';
    return { ...state, status: 'running', keystrokes: [...state.keystrokes, { t, expected: want, typed: c, correct: false }] };
  }
  const typed = withWord(state.typed, state.wordIndex, current + c);
  const next: TestState = {
    ...state,
    status: 'running',
    typed,
    keystrokes: [...state.keystrokes, { t, expected, typed: c, correct: c === expected }],
  };
  const isLastWord = state.wordIndex === state.targets.length - 1;
  if (state.mode.kind === 'text' && isLastWord && typed[state.wordIndex] === target) {
    return { ...next, status: 'finished' };
  }
  return next;
}

function space(state: TestState, t: number): TestState {
  const current = state.typed[state.wordIndex] ?? '';
  if (current.length === 0) return state;
  const target = state.targets[state.wordIndex] ?? '';
  // Space ends the word early if letters are missing; wrong or extra letters were already counted.
  const skipped = current.length < target.length;
  const expected = skipped ? (target[current.length] ?? ' ') : ' ';
  const keystroke: Keystroke = { t, expected, typed: ' ', correct: !skipped };
  if (skipped && state.rules.stopOnError) return { ...state, keystrokes: [...state.keystrokes, keystroke] };
  const keystrokes = [...state.keystrokes, keystroke];
  const isLastWord = state.wordIndex === state.targets.length - 1;
  return {
    ...state,
    status: isLastWord ? 'finished' : 'running',
    typed: [...state.typed, ''],
    wordIndex: state.wordIndex + 1,
    keystrokes,
  };
}

function backspace(state: TestState): TestState {
  if (state.rules.noBackspace) return state;
  const current = state.typed[state.wordIndex] ?? '';
  if (current.length > 0) {
    return { ...state, typed: withWord(state.typed, state.wordIndex, current.slice(0, -1)) };
  }
  const prev = state.wordIndex - 1;
  // Going back is only allowed into a word that still has a mistake in it.
  if (prev < 0 || state.typed[prev] === state.targets[prev]) return state;
  return { ...state, typed: state.typed.slice(0, -1), wordIndex: prev };
}

function withWord(typed: string[], index: number, value: string): string[] {
  const copy = typed.slice();
  copy[index] = value;
  return copy;
}

/** Appends more words in time mode so the test never runs out of text. */
export function extendTargets(state: TestState, more: string[]): TestState {
  return { ...state, targets: [...state.targets, ...more] };
}
