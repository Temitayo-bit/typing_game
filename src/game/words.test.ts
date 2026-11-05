import { describe, expect, it } from 'vitest';
import { pickWords, splitText } from './words';

describe('pickWords', () => {
  it('never repeats a word twice in a row', () => {
    expect(pickWords(['a', 'b'], 5, () => 0)).toEqual(['a', 'b', 'a', 'b', 'a']);
    expect(pickWords(['a', 'a', 'b'], 4, () => 0)).toEqual(['a', 'b', 'a', 'b']);
  });

  it('allows repeats when there is only one word', () => {
    expect(pickWords(['a'], 3, () => 0.5)).toEqual(['a', 'a', 'a']);
  });

  it('returns nothing for a count of 0', () => {
    expect(pickWords(['a'], 0)).toEqual([]);
  });

  it('throws on an empty source', () => {
    expect(() => pickWords([], 3)).toThrow();
  });
});

describe('splitText', () => {
  it('splits on any whitespace and drops empties', () => {
    expect(splitText('  a \n b  ')).toEqual(['a', 'b']);
    expect(splitText('')).toEqual([]);
  });
});
