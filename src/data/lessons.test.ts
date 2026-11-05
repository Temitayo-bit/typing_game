import { describe, expect, it } from 'vitest';
import { fingerFor, keyFor } from './fingers';
import { keysUpTo, lessons, levels } from './lessons';
import { alternatingWords, next50, top50 } from './lessonVocab';

const SHIFT_LESSON = 13;

/** Every character must use a key taught by this lesson, and capitals only after Shift is taught. */
function untypeable(text: string, lessonId: number): string[] {
  const keys = keysUpTo(lessonId);
  return [...text].filter((c) => {
    if (c === ' ') return false;
    if (keys.has(c)) return false;
    const { key, shift } = keyFor(c);
    return !(shift && lessonId >= SHIFT_LESSON && keys.has(key));
  });
}

describe('lesson plan', () => {
  it('has 40 lessons in 10 levels of 4, numbered 1 to 40 in order', () => {
    expect(lessons.map((l) => l.id)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    expect(levels.map((l) => l.id)).toEqual(Array.from({ length: 10 }, (_, i) => i + 1));
    for (const level of levels) expect(lessons.filter((l) => l.level === level.id)).toHaveLength(4);
  });

  it('teaches every letter exactly once', () => {
    const letters = lessons.flatMap((l) => l.newKeys).filter((k) => /[a-z]/.test(k));
    expect(new Set(letters).size).toBe(26);
    expect(letters).toHaveLength(26);
  });

  it('never teaches the same key twice', () => {
    const keys = lessons.flatMap((l) => l.newKeys);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives every advanced lesson the content its kind needs', () => {
    for (const l of lessons) {
      if (l.kind === 'patterns') expect(l.focus?.length && l.words?.length, `lesson ${l.id}`).toBeTruthy();
      if (l.kind === 'symbols' || l.kind === 'speed') expect(l.words?.length, `lesson ${l.id}`).toBeGreaterThanOrEqual(10);
      if (l.kind === 'reading' || l.kind === 'sentences') expect(l.passages?.length, `lesson ${l.id}`).toBeGreaterThanOrEqual(4);
    }
  });

  it('only uses keys each lesson has taught, in its words and passages', () => {
    for (const l of lessons) {
      for (const text of [...(l.words ?? []), ...(l.passages ?? []), ...(l.focus ?? [])]) {
        expect(untypeable(text, l.id), `lesson ${l.id}: ${text}`).toEqual([]);
      }
    }
  });

  it('gives letter lessons themed words once there are enough keys', () => {
    const withWords = lessons.filter((l) => l.kind === 'keys' && l.words);
    expect(withWords.map((l) => l.id)).toContain(3);
    expect(lessons.find((l) => l.id === 12)!.words!.length).toBeGreaterThan(20);
  });

  it('uses words that contain every focus group in pattern lessons', () => {
    for (const l of lessons.filter((x) => x.kind === 'patterns')) {
      for (const f of l.focus!) expect(l.words!.some((w) => w.includes(f)), `${f} in lesson ${l.id}`).toBe(true);
      for (const w of l.words!) expect(l.focus!.some((f) => w.includes(f)), `${w} in lesson ${l.id}`).toBe(true);
    }
  });

  it('gives each symbol lesson words that practise its new symbols', () => {
    for (const l of lessons.filter((x) => x.kind === 'symbols')) {
      for (const k of l.newKeys) expect(l.words!.some((w) => w.includes(k)), `${k} in lesson ${l.id}`).toBe(true);
    }
  });

  it('only lists words that really alternate hands in the rhythm lesson', () => {
    const hand = (c: string) => fingerFor(c)?.split(' ')[0];
    for (const w of alternatingWords) {
      for (let i = 1; i < w.length; i++) expect(hand(w[i]!), w).not.toBe(hand(w[i - 1]!));
    }
  });

  it('has exactly 50 distinct words in each speed list', () => {
    expect(new Set(top50).size).toBe(50);
    expect(new Set(next50).size).toBe(50);
  });

  it('keeps passages free of characters no lesson teaches, like curly quotes or dashes', () => {
    const text = lessons.flatMap((l) => [...(l.passages ?? []), ...(l.words ?? [])]).join('');
    expect(text).toMatch(/^[\x20-\x7e]*$/);
  });
});
