import { describe, expect, it } from 'vitest';
import { lessonsInLevel } from '../data/exams';
import { keysUpTo, lessons, lessonWordPool, levels } from '../data/lessons';
import { packs } from '../data/packs';
import { commonWords } from '../data/words';
import { examWords } from './examWords';

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

const sources = { words: [...new Set([...commonWords, ...lessonWordPool])], passages: packs.flatMap((p) => p.passages) };

function typeableAt(level: number): Set<string> {
  const last = lessonsInLevel(level).at(-1)!.id;
  const keys = keysUpTo(last);
  const chars = new Set([' ', ...keys]);
  if (lessons.some((l) => l.kind === 'shift' && l.id <= last)) for (const k of keys) if (/[a-z]/.test(k)) chars.add(k.toUpperCase());
  return chars;
}

describe('examWords', () => {
  it('only uses keys taught up to the end of the level', () => {
    for (const level of levels) {
      const chars = typeableAt(level.id);
      for (let seed = 1; seed <= 5; seed++) {
        const words = examWords(level.id, 120, sources, seeded(seed * 31 + level.id));
        expect(words).toHaveLength(120);
        const bad = words.join(' ').split('').filter((c) => !chars.has(c));
        expect(bad, `level ${level.id}`).toEqual([]);
      }
    }
  });

  it('draws mostly from the level just finished and mixes in earlier ones', () => {
    const level2 = new Set(lessonsInLevel(2).flatMap((l) => l.newKeys));
    const hasNew = (w: string) => [...w].some((c) => level2.has(c));
    // A source that always picks the earlier pool can only use level 1 keys.
    expect(examWords(2, 60, sources, () => 0.99).some(hasNew)).toBe(false);
    expect(examWords(2, 60, sources, () => 0.0).some(hasNew)).toBe(true);
  });

  it('skips the letter-group lessons when revisiting earlier levels', () => {
    const words = examWords(3, 200, sources, () => 0.99);
    expect(words.some((w) => /^[fj]+$/.test(w))).toBe(false);
  });

  it('cuts long passages so one lesson cannot fill the exam', () => {
    const random = seeded(7);
    const words = examWords(10, 200, sources, random);
    expect(words).toHaveLength(200);
  });
});
