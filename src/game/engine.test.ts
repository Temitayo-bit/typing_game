import { describe, expect, it } from 'vitest';
import { createTest, extendTargets, reduce, type Action, type TestState } from './engine';

function type(state: TestState, text: string, start = 0): TestState {
  return [...text].reduce<TestState>((s, char, i) => {
    const action: Action = char === '\b' ? { type: 'backspace', t: start + i } : { type: 'char', char, t: start + i };
    return reduce(s, action);
  }, state);
}

describe('engine', () => {
  const words = createTest({ kind: 'text' }, ['hi', 'you']);

  it('starts running on the first keystroke', () => {
    expect(words.status).toBe('ready');
    expect(type(words, 'h').status).toBe('running');
  });

  it('records correct and incorrect keystrokes against the expected char', () => {
    const s = type(words, 'hx');
    expect(s.keystrokes.map((k) => [k.expected, k.typed, k.correct])).toEqual([
      ['h', 'h', true],
      ['i', 'x', false],
    ]);
  });

  it('records extra characters past the end of a word as wrong', () => {
    const s = type(words, 'hii');
    expect(s.keystrokes[2]).toMatchObject({ expected: null, correct: false });
    expect(s.typed[0]).toBe('hii');
  });

  it('ignores space at the start of a word', () => {
    expect(type(words, ' ')).toEqual(words);
  });

  it('moves to the next word on space', () => {
    const s = type(words, 'hi ');
    expect(s.wordIndex).toBe(1);
    expect(s.keystrokes.at(-1)).toMatchObject({ expected: ' ', correct: true });
  });

  it('finishes words mode when the last word is typed correctly', () => {
    expect(type(words, 'hi you').status).toBe('finished');
  });

  it('finishes words mode on space after a wrong last word', () => {
    const s = type(words, 'hi yoo');
    expect(s.status).toBe('running');
    expect(type(s, ' ').status).toBe('finished');
  });

  it('does not finish time mode on the last correct word', () => {
    const timed = createTest({ kind: 'time', seconds: 15 }, ['hi']);
    expect(type(timed, 'hi').status).toBe('running');
  });

  it('backspaces within a word', () => {
    expect(type(words, 'hx\b').typed[0]).toBe('h');
  });

  it('allows going back into a previous word only if it has a mistake', () => {
    expect(type(words, 'hi \b').wordIndex).toBe(1);
    const back = type(words, 'ho \b');
    expect(back.wordIndex).toBe(0);
    expect(back.typed).toEqual(['ho']);
  });

  it('ignores input after finishing', () => {
    const done = reduce(type(words, 'h'), { type: 'finish' });
    expect(type(done, 'abc')).toBe(done);
  });

  it('rejects an empty word list', () => {
    expect(() => createTest({ kind: 'text' }, [])).toThrow();
  });
});

describe('space keystrokes', () => {
  const words = createTest({ kind: 'text' }, ['hello', 'you']);

  it('is correct after a full-length word, even with a typo in it', () => {
    expect(type(words, 'hxllo ').keystrokes.at(-1)).toMatchObject({ expected: ' ', correct: true });
  });

  it('counts as the missing letter when a word is cut short', () => {
    expect(type(words, 'hel ').keystrokes.at(-1)).toMatchObject({ expected: 'l', correct: false });
  });
});

describe('engine edge cases', () => {
  const words = createTest({ kind: 'text' }, ['hi', 'you']);

  it('finishes time mode if the last available word is committed', () => {
    const timed = createTest({ kind: 'time', seconds: 15 }, ['hi']);
    expect(type(timed, 'hi ').status).toBe('finished');
  });

  it('keeps progress when more words are appended', () => {
    const s = extendTargets(type(words, 'hi y'), ['more']);
    expect(s.targets).toEqual(['hi', 'you', 'more']);
    expect(s.typed).toEqual(['hi', 'y']);
    expect(s.wordIndex).toBe(1);
    expect(s.keystrokes).toHaveLength(4);
  });

  it('finish keeps keystrokes', () => {
    const s = reduce(type(words, 'hi'), { type: 'finish' });
    expect(s.status).toBe('finished');
    expect(s.keystrokes).toHaveLength(2);
  });

  it('backspace before typing does nothing', () => {
    expect(reduce(words, { type: 'backspace', t: 0 })).toBe(words);
  });

  it('can fix a previous word and move on again', () => {
    const s = type(words, 'ho \b\bi ');
    expect(s.wordIndex).toBe(1);
    expect(s.typed).toEqual(['hi', '']);
    expect(s.keystrokes.filter((k) => k.typed === ' ')).toHaveLength(2);
  });

  it('stays on the next word when backspacing after a correct word', () => {
    expect(type(words, 'hi \b').typed).toEqual(['hi', '']);
  });
});

describe('practice rules', () => {
  it('ignores backspace when backspace is off', () => {
    const s = type(createTest({ kind: 'text' }, ['hi', 'you'], { noBackspace: true }), 'hx\b');
    expect(s.typed[0]).toBe('hx');
  });

  it('holds the cursor on a wrong key until the right one, counting the miss', () => {
    const strict = createTest({ kind: 'text' }, ['hi', 'you'], { stopOnError: true });
    const s = type(strict, 'hxi');
    expect(s.typed[0]).toBe('hi');
    expect(s.keystrokes.map((k) => k.correct)).toEqual([true, false, true]);
  });

  it('counts a run of wrong presses at one spot as a single miss', () => {
    const strict = createTest({ kind: 'text' }, ['hi', 'you'], { stopOnError: true });
    const s = type(strict, 'hxxxi');
    expect(s.keystrokes.map((k) => k.correct)).toEqual([true, false, true]);
  });

  it('expects space after a finished word when the cursor waits', () => {
    const strict = createTest({ kind: 'text' }, ['hi', 'you'], { stopOnError: true });
    const s = type(strict, 'hix');
    expect(s.typed[0]).toBe('hi');
    expect(s.keystrokes.at(-1)).toMatchObject({ expected: ' ', typed: 'x', correct: false });
  });

  it('does not let space skip a word with letters missing when the cursor waits', () => {
    const strict = createTest({ kind: 'text' }, ['hi', 'you'], { stopOnError: true });
    const s = type(strict, 'h ');
    expect(s.wordIndex).toBe(0);
    expect(s.keystrokes.at(-1)).toMatchObject({ typed: ' ', correct: false });
    expect(type(s, 'i you').status).toBe('finished');
  });
});
