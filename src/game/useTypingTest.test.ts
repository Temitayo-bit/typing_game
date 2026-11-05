import { describe, expect, it } from 'vitest';
import { freshWords } from './useTypingTest';

describe('freshWords', () => {
  it('skips a text that matches the one just typed', () => {
    const texts = [['a', 'b'], ['a', 'b'], ['c', 'd']];
    let i = 0;
    expect(freshWords(() => texts[i++]!, ['a', 'b'])).toEqual(['c', 'd']);
  });

  it('gives up and repeats when the source only has one text', () => {
    expect(freshWords(() => ['only'], ['only'])).toEqual(['only']);
  });
});
