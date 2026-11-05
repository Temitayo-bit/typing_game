import { describe, expect, it } from 'vitest';
import { keysUpTo, lessonWordPool, lessons, punctuationPool, STEPS_PER_LESSON } from '../data/lessons';
import { commonWords } from '../data/words';
import { lessonDrill, weakKeyDrill } from './lessonWords';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const sources = { words: [...lessonWordPool, ...commonWords], passages: ['one two three'] };

describe('lessonDrill', () => {
  it('only uses unlocked keys in every step of every letter lesson', () => {
    for (const lesson of lessons.filter((l) => l.kind === 'keys')) {
      const allowed = keysUpTo(lesson.id);
      for (let step = 1; step <= STEPS_PER_LESSON; step++) {
        const drill = lessonDrill(lesson, step, sources, seeded(lesson.id * 10 + step));
        expect(drill.length).toBeGreaterThanOrEqual(20);
        for (const word of drill) {
          expect(word.length).toBeGreaterThan(0);
          for (const c of word) expect(allowed.has(c), `${c} in lesson ${lesson.id} step ${step}`).toBe(true);
        }
      }
    }
  });

  it('starts with only f and j', () => {
    const drill = lessonDrill(lessons[0]!, 1, sources, seeded(3));
    expect(drill.join('')).toMatch(/^[fj]+$/);
  });

  it('moves from letter groups to real words over the steps', () => {
    const lesson = lessons.find((l) => l.id === 9)!;
    const isWord = (w: string) => sources.words.includes(w);
    const step1 = lessonDrill(lesson, 1, sources, seeded(1)).filter(isWord).length;
    const step8 = lessonDrill(lesson, 8, sources, seeded(1)).filter(isWord).length;
    expect(step8).toBeGreaterThan(step1);
  });

  it('adds capitals in the shift lesson', () => {
    const drill = lessonDrill(lessons.find((l) => l.kind === 'shift')!, 8, sources, seeded(2));
    expect(drill.some((w) => /^[A-Z]/.test(w))).toBe(true);
  });

  it('adds quotes and questions in the punctuation lesson', () => {
    const drill = lessonDrill(lessons.find((l) => l.kind === 'punctuation')!, 8, sources, seeded(2));
    expect(drill.some((w) => punctuationPool.includes(w))).toBe(true);
  });

  it('uses a passage in the sentences lessons', () => {
    expect(lessonDrill(lessons.at(-2)!, 1, sources)).toEqual(['one', 'two', 'three']);
    expect(lessonDrill(lessons.at(-1)!, 8, sources)).toHaveLength(6);
  });

  it('adds digits in the number lessons', () => {
    const drill = lessonDrill(lessons.find((l) => l.id === 17)!, 1, sources, seeded(5));
    expect(drill.some((w) => /^[1-5]+$/.test(w))).toBe(true);
    expect(drill.join('')).not.toMatch(/[6-90]/);
  });

  it('gives every step of every lesson some text', () => {
    for (const lesson of lessons) {
      for (let step = 1; step <= STEPS_PER_LESSON; step++) {
        expect(lessonDrill(lesson, step, sources, seeded(step)).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('weakKeyDrill', () => {
  it('prefers words containing the missed keys', () => {
    const drill = weakKeyDrill(['apple', 'zoo', 'pear', 'plum', 'pip', 'kiwi'], ['p'], 10, seeded(4));
    expect(drill.every((w) => w.includes('p'))).toBe(true);
  });

  it('falls back to any word when too few match', () => {
    expect(weakKeyDrill(['a', 'b'], ['q'], 3, () => 0)).toEqual(['a', 'a', 'a']);
  });
});

describe('lesson plan', () => {
  it('has 20 lessons in 5 levels of 4 and teaches every letter exactly once', () => {
    expect(lessons).toHaveLength(20);
    for (let level = 1; level <= 5; level++) expect(lessons.filter((l) => l.level === level)).toHaveLength(4);
    const letters = lessons.flatMap((l) => l.newKeys).filter((k) => /[a-z]/.test(k));
    expect(new Set(letters).size).toBe(26);
    expect(letters).toHaveLength(26);
  });

  it('numbers lessons 1 to 20 in order', () => {
    expect(lessons.map((l) => l.id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
});
