import type { Keystroke, TestState } from './engine';
import { netChars } from './net';

export type Result = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  typedChars: number;
  durationMs: number;
  /** Mistyped count per expected character, e.g. { e: 3, ' ': 1 } */
  missedKeys: Record<string, number>;
  /** Every press per expected character, right or wrong, so misses can be read as a rate. Missing on old results. */
  keyPresses?: Record<string, number>;
  /** Net WPM at the end of each whole second */
  wpmBySecond: number[];
};

const CHARS_PER_WORD = 5;

export function wordsPerMinute(chars: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return chars / CHARS_PER_WORD / (durationMs / 60_000);
}

export function correctChars(state: TestState): number {
  return netChars(state.targets, state.typed, state.wordIndex);
}

export function computeResult(state: TestState, durationMs: number): Result {
  const { keystrokes } = state;
  const correct = correctChars(state);
  const hits = keystrokes.filter((k) => k.correct).length;
  return {
    wpm: round1(wordsPerMinute(correct, durationMs)),
    rawWpm: round1(wordsPerMinute(keystrokes.length, durationMs)),
    accuracy: keystrokes.length === 0 ? 0 : round1((hits / keystrokes.length) * 100),
    correctChars: correct,
    typedChars: keystrokes.length,
    durationMs,
    missedKeys: missedKeys(keystrokes),
    keyPresses: keyPresses(keystrokes),
    wpmBySecond: wpmBySecond(state.netTimeline, durationMs),
  };
}

function missedKeys(keystrokes: Keystroke[]): Record<string, number> {
  const missed: Record<string, number> = {};
  for (const k of keystrokes) {
    if (k.correct || k.expected === null) continue;
    missed[k.expected] = (missed[k.expected] ?? 0) + 1;
  }
  return missed;
}

function keyPresses(keystrokes: Keystroke[]): Record<string, number> {
  const presses: Record<string, number> = {};
  for (const k of keystrokes) {
    if (k.expected === null) continue;
    presses[k.expected] = (presses[k.expected] ?? 0) + 1;
  }
  return presses;
}

function wpmBySecond(timeline: TestState['netTimeline'], durationMs: number): number[] {
  const seconds = Math.floor(durationMs / 1000);
  const points: number[] = [];
  let net = 0;
  let i = 0;
  for (let s = 1; s <= seconds; s++) {
    while (i < timeline.length && (timeline[i]?.t ?? Infinity) <= s * 1000) {
      net = timeline[i]?.net ?? net;
      i++;
    }
    points.push(round1(wordsPerMinute(net, s * 1000)));
  }
  return points;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
