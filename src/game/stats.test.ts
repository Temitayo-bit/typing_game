import { describe, expect, it } from 'vitest';
import { createTest, reduce, type TestState } from './engine';
import { computeResult, correctChars, wordsPerMinute } from './stats';

function typeAt(state: TestState, text: string, msPerKey: number): TestState {
  return [...text].reduce<TestState>(
    (s, char, i) => reduce(s, char === '\b' ? { type: 'backspace', t: i * msPerKey } : { type: 'char', char, t: i * msPerKey }),
    state,
  );
}

describe('wordsPerMinute', () => {
  it('uses 5 characters per word', () => {
    expect(wordsPerMinute(50, 60_000)).toBe(10);
    expect(wordsPerMinute(25, 15_000)).toBe(20);
  });

  it('is 0 for no elapsed time', () => {
    expect(wordsPerMinute(10, 0)).toBe(0);
  });
});

describe('correctChars', () => {
  const test = createTest({ kind: 'time', seconds: 30 }, ['abc', 'de', 'fgh']);

  it('counts correct committed words with their space', () => {
    expect(correctChars(typeAt(test, 'abc ', 1))).toBe(4);
  });

  it('does not count a wrong committed word', () => {
    expect(correctChars(typeAt(test, 'abx de ', 1))).toBe(3);
  });

  it('counts the correct prefix of the word in progress', () => {
    expect(correctChars(typeAt(test, 'abc d', 1))).toBe(5);
    expect(correctChars(typeAt(test, 'abc dx', 1))).toBe(4);
  });
});

describe('computeResult', () => {
  it('computes wpm, raw wpm and accuracy', () => {
    const test = createTest({ kind: 'text' }, ['hello', 'world']);
    // 'hellp' + backspace + 'o world': 13 char keystrokes, 1 wrong
    const done = typeAt(test, 'hellp\bo world', 100);
    expect(done.status).toBe('finished');
    const r = computeResult(done, 6_000);
    expect(r.correctChars).toBe(11);
    expect(r.wpm).toBe(22);
    expect(r.typedChars).toBe(12);
    expect(r.rawWpm).toBe(24);
    expect(r.accuracy).toBe(91.7);
    expect(r.missedKeys).toEqual({ o: 1 });
  });

  it('reports cumulative wpm per whole second', () => {
    const test = createTest({ kind: 'time', seconds: 2 }, ['aaaaa', 'aaaaa']);
    const s = typeAt(test, 'aaaaa', 200);
    expect(computeResult(s, 2_000).wpmBySecond).toEqual([60, 30]);
  });

  it('has zero accuracy when nothing was typed', () => {
    const test = createTest({ kind: 'time', seconds: 15 }, ['a']);
    expect(computeResult(test, 15_000).accuracy).toBe(0);
  });
});

describe('missed keys', () => {
  it('does not count extra letters as a missed key', () => {
    const test = createTest({ kind: 'text' }, ['ab', 'c']);
    expect(computeResult(typeAt(test, 'abx c', 100), 1000).missedKeys).toEqual({});
  });
});
