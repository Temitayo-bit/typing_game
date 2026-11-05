import { describe, expect, it } from 'vitest';
import { keyFor } from '../data/fingers';
import { keysUpTo, lessons, STEPS_PER_LESSON, type Lesson } from '../data/lessons';
import { advancedDrill, isAdvanced } from './advancedDrills';
import { wordSource } from './sources';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const advanced = lessons.filter(isAdvanced);
const byId = (id: number) => advanced.find((l) => l.id === id)!;

describe('advancedDrill', () => {
  it('covers lessons 21 to 40', () => {
    expect(advanced.map((l) => l.id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 21));
  });

  it('gives every step of every advanced lesson typeable text', () => {
    for (const lesson of advanced) {
      const keys = keysUpTo(lesson.id);
      for (let step = 1; step <= STEPS_PER_LESSON; step++) {
        const drill = advancedDrill(lesson, step, seeded(lesson.id * 10 + step));
        expect(drill.length, `lesson ${lesson.id} step ${step}`).toBeGreaterThan(5);
        for (const c of drill.join('')) expect(keys.has(c) || keys.has(keyFor(c).key), `${c} in lesson ${lesson.id}`).toBe(true);
      }
    }
  });

  it('starts pattern lessons with the letter groups as chunks', () => {
    const lesson = byId(21);
    const drill = advancedDrill(lesson, 1, seeded(1));
    expect(drill.filter((w) => lesson.focus!.some((f) => w === f.repeat(2))).length).toBeGreaterThan(5);
  });

  it('repeats each word three times in the first speed practice', () => {
    const drill = advancedDrill(byId(29), 1, seeded(2));
    for (let i = 0; i + 2 < drill.length; i += 3) expect(new Set(drill.slice(i, i + 3)).size).toBe(1);
  });

  it('mixes symbol words with plain words', () => {
    const lesson = byId(26);
    const drill = advancedDrill(lesson, 5, seeded(3));
    expect(drill.some((w) => lesson.words!.includes(w))).toBe(true);
    expect(drill.some((w) => !lesson.words!.includes(w))).toBe(true);
  });

  it('gives each early reading practice its own passage and a longer checkpoint', () => {
    const lesson = byId(37);
    expect(advancedDrill(lesson, 1).join(' ')).toBe(lesson.passages![0]);
    expect(advancedDrill(lesson, 2).join(' ')).toBe(lesson.passages![1]);
    expect(advancedDrill(lesson, 8, seeded(4)).length).toBeGreaterThan(advancedDrill(lesson, 1).length);
  });

  it('fails loudly when a lesson is missing its content', () => {
    const broken = { ...byId(37), passages: [] } as Lesson & { kind: 'reading' };
    expect(() => advancedDrill(broken, 1)).toThrow(/needs passages/);
  });

  it('is reachable through the normal lesson word source', () => {
    const words = wordSource({ kind: 'lesson', lessonId: 40, step: 1 }, { lessonId: 40, step: 1 })(25);
    expect(words.join(' ')).toBe(byId(40).passages![0]);
  });
});
