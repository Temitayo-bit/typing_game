import { describe, expect, it } from 'vitest';
import { lessons } from '../data/lessons';
import { packs } from '../data/packs';
import { wordSource } from '../game/sources';
import { splitText } from '../game/words';
import { passagesIn, seenTexts, textKey, unseen } from './seen';

const pack = packs[0]!;
const start = { lessonId: 1, step: 1 };

describe('seen passages', () => {
  it('gives the same id whatever the capitals or punctuation', () => {
    expect(textKey('Hello there, friend.')).toBe(textKey('hello there friend'));
    expect(textKey('one')).not.toBe(textKey('two'));
  });

  it('finds only passages typed in full', () => {
    const p = pack.passages[0]!;
    const words = splitText(p);
    expect(passagesIn(words)).toEqual([textKey(p)]);
    expect(passagesIn(words.slice(0, -1))).toEqual([]);
    expect(passagesIn(['just', 'random', 'words'])).toEqual([]);
  });

  it('recognises lesson passages too', () => {
    const own = lessons.find((l) => l.passages?.length)?.passages?.[0];
    if (!own) return;
    expect(passagesIn(splitText(own))).toContain(textKey(own));
  });

  it('collects ids from a history', () => {
    expect([...seenTexts([{ textKeys: ['a', 'b'] }, {}, { textKeys: ['b'] }])].sort()).toEqual(['a', 'b']);
  });

  it('keeps unseen passages, and brings everything back once they are all seen', () => {
    const [a, b] = ['first one', 'second one'];
    expect(unseen([a, b], new Set([textKey(a)]))).toEqual([b]);
    expect(unseen([a, b], new Set([textKey(a), textKey(b)]))).toEqual([a, b]);
  });

  it('skips pack passages she has typed until the pack runs out', () => {
    const seen = new Set(pack.passages.slice(0, -1).map(textKey));
    const source = wordSource({ kind: 'pack', packId: pack.id }, start, () => 0, [], seen);
    expect(source(60).join(' ')).toBe(pack.passages.at(-1));
    // The set is read live: once the last one is typed too, the pack starts over.
    seen.add(textKey(pack.passages.at(-1)!));
    const next = source(60).join(' ');
    expect(pack.passages).toContain(next);
  });
});
