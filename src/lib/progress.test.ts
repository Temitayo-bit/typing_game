import { describe, expect, it } from 'vitest';
import { weakKeys } from './weakKeys';
import { lessons } from '../data/lessons';
import type { SavedResult } from './history';
import { parseExport } from './history';
import { activityByDay, dayStreak, examOpen, isUnlocked, longestStreak, lessonStatus, nextStep, passedExam, personalBest, unlockedStep } from './progress';

function result(over: Partial<SavedResult>): SavedResult {
  return {
    wpm: 40, rawWpm: 42, accuracy: 95, correctChars: 100, typedChars: 105, durationMs: 30_000,
    missedKeys: {}, wpmBySecond: [], mode: 'time-30', finishedAt: 0, ...over,
  };
}

const day = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).getTime();

describe('personalBest', () => {
  it('picks the highest wpm for that mode only', () => {
    const rs = [result({ wpm: 50 }), result({ wpm: 70, mode: 'time-15' }), result({ wpm: 60 })];
    expect(personalBest(rs, 'time-30')?.wpm).toBe(60);
    expect(personalBest(rs, 'words-10')).toBeUndefined();
  });
});

describe('dayStreak', () => {
  const now = new Date(2026, 10, 5, 9);

  it('counts consecutive days ending today', () => {
    const rs = [day(2026, 10, 5), day(2026, 10, 4), day(2026, 10, 3), day(2026, 10, 1)].map((t) => result({ finishedAt: t }));
    expect(dayStreak(rs, now)).toBe(3);
  });

  it('keeps the streak alive if the last test was yesterday', () => {
    expect(dayStreak([result({ finishedAt: day(2026, 10, 4) })], now)).toBe(1);
  });

  it('is 0 after a missed day', () => {
    expect(dayStreak([result({ finishedAt: day(2026, 10, 3) })], now)).toBe(0);
  });

  it('crosses month boundaries', () => {
    const rs = [day(2026, 10, 1), day(2026, 9, 31)].map((t) => result({ finishedAt: t }));
    expect(dayStreak(rs, new Date(2026, 10, 1, 20))).toBe(2);
  });
});

describe('parseExport', () => {
  it('accepts a valid export, keeping every field and dropping ids', () => {
    const full = result({ missedKeys: { e: 2 }, keyPresses: { e: 9, a: 4 }, wpmBySecond: [30, 40] });
    expect(parseExport({ version: 1, results: [{ ...full, id: 7 }] })).toEqual([full]);
  });

  it('rejects results with missing or wrong fields', () => {
    const bad = [
      { wpm: 1, accuracy: 1, mode: 'time-30', finishedAt: 1 },
      { ...result({}), mode: 'bogus' },
      { ...result({}), missedKeys: { e: 'x' } },
      { ...result({}), wpmBySecond: [1, 'a'] },
      { ...result({}), wpm: Number.NaN },
      null,
    ];
    for (const r of bad) expect(() => parseExport({ version: 1, results: [r] })).toThrow('Result 1');
  });

  it('rejects files that are not exports', () => {
    expect(() => parseExport({ results: [] })).toThrow("That file isn't a progress export");
    expect(() => parseExport({ version: 1, results: [{ wpm: 'fast' }] })).toThrow('Result 1');
  });
});

describe('lesson steps', () => {
  const pass = (mode: SavedResult['mode']) => result({ mode, accuracy: 90 });

  it('starts at lesson 1 step 1', () => {
    expect(unlockedStep([])).toEqual({ lessonId: 1, step: 1 });
  });

  it('unlocks the next step at 90% accuracy, whatever the speed', () => {
    expect(unlockedStep([result({ mode: 'lesson-1-1', accuracy: 90, wpm: 2 })])).toEqual({ lessonId: 1, step: 2 });
    // One right letter in a timed sprint is 100% accurate but not a pass.
    expect(unlockedStep([result({ mode: 'lesson-1-1', accuracy: 100, correctChars: 1 })])).toEqual({ lessonId: 1, step: 1 });
    expect(unlockedStep([result({ mode: 'lesson-1-1', accuracy: 89.9, wpm: 80 })])).toEqual({ lessonId: 1, step: 1 });
  });

  it('rolls over from the last step to the next lesson', () => {
    expect(unlockedStep([pass('lesson-3-8')])).toEqual({ lessonId: 4, step: 1 });
  });

  it('never goes past the very last step', () => {
    const last = lessons.length;
    expect(unlockedStep([pass(`lesson-${last}-8`)])).toEqual({ lessonId: last, step: 8 });
  });

  it('carries on into the advanced levels after the old final lesson once level 5 is passed', () => {
    expect(unlockedStep([pass('lesson-20-8'), pass('exam-5')])).toEqual({ lessonId: 21, step: 1 });
  });

  it('ignores results for lessons that do not exist', () => {
    expect(unlockedStep([pass('lesson-99-1'), pass('lesson-2-9')])).toEqual({ lessonId: 1, step: 1 });
  });

  it('reports each lesson as done, current or locked', () => {
    const results = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => pass(`lesson-1-${s}`)).concat(pass('lesson-2-1'));
    const unlocked = unlockedStep(results);
    expect(lessonStatus(results, 1, unlocked)).toMatchObject({ state: 'done', passedSteps: 8 });
    expect(lessonStatus(results, 2, unlocked)).toMatchObject({ state: 'current', passedSteps: 1 });
    expect(lessonStatus(results, 3, unlocked)).toMatchObject({ state: 'locked', passedSteps: 0 });
  });

  it('tracks best accuracy including failed tries, and 7 of 8 steps is still current', () => {
    const tries = [1, 2, 3, 4, 5, 6, 7].map((s) => pass(`lesson-1-${s}`)).concat(result({ mode: 'lesson-1-8', accuracy: 95 - 10 }));
    expect(lessonStatus(tries, 1, unlockedStep(tries))).toMatchObject({ state: 'current', passedSteps: 7, bestAccuracy: 90 });
    expect(lessonStatus([], 2, unlockedStep([])).bestAccuracy).toBeUndefined();
  });

  it('finds the next step', () => {
    expect(nextStep({ lessonId: 1, step: 8 })).toEqual({ lessonId: 2, step: 1 });
    expect(nextStep({ lessonId: 20, step: 8 })).toEqual({ lessonId: 21, step: 1 });
    expect(nextStep({ lessonId: lessons.length, step: 8 })).toBeNull();
    expect(isUnlocked({ lessonId: 2, step: 3 }, { lessonId: 2, step: 2 })).toBe(false);
  });
});


describe('empty history', () => {
  it('has no best, no streak and no missed keys', () => {
    expect(personalBest([], 'time-30')).toBeUndefined();
    expect(dayStreak([])).toBe(0);
    expect(weakKeys([])).toEqual([]);
  });

});

describe('longestStreak and activity', () => {
  it('finds the longest run of days, across months', () => {
    const rs = [day(2026, 9, 30), day(2026, 9, 31), day(2026, 10, 1), day(2026, 10, 1, 20), day(2026, 10, 4)].map((t) =>
      result({ finishedAt: t }),
    );
    expect(longestStreak(rs)).toBe(3);
    expect(longestStreak([])).toBe(0);
  });

  it('counts tests per day, oldest first', () => {
    const rs = [day(2026, 10, 5), day(2026, 10, 5, 8), day(2026, 10, 3)].map((t) => result({ finishedAt: t }));
    expect(activityByDay(rs, 3, new Date(2026, 10, 5, 22))).toEqual([1, 0, 2]);
  });
});

describe('level exams', () => {
  const pass = (mode: SavedResult['mode'], over: Partial<SavedResult> = {}) => result({ mode, accuracy: 95, ...over });

  it('holds the next level until the exam is passed', () => {
    expect(unlockedStep([pass('lesson-4-8')])).toEqual({ lessonId: 4, step: 8 });
    expect(unlockedStep([pass('lesson-4-8'), pass('exam-1')])).toEqual({ lessonId: 5, step: 1 });
  });

  it('needs 90% accuracy and enough typing to pass, like a practice', () => {
    expect(passedExam([pass('exam-1', { accuracy: 89.9 })], 1)).toBe(false);
    expect(passedExam([pass('exam-1', { correctChars: 3 })], 1)).toBe(false);
    expect(passedExam([pass('exam-1', { accuracy: 90 })], 1)).toBe(true);
    expect(passedExam([pass('exam-2')], 1)).toBe(false);
    expect(unlockedStep([pass('lesson-4-8'), pass('exam-1', { accuracy: 80 })])).toEqual({ lessonId: 4, step: 8 });
  });

  it('keeps progress made before exams existed open', () => {
    expect(unlockedStep([pass('lesson-6-3')])).toEqual({ lessonId: 6, step: 4 });
    expect(examOpen([pass('lesson-6-3')], 1)).toBe(true);
  });

  it('opens an exam only after the last practice of its level', () => {
    expect(examOpen([], 1)).toBe(false);
    expect(examOpen([pass('lesson-4-7')], 1)).toBe(false);
    expect(examOpen([pass('lesson-4-8')], 1)).toBe(true);
    expect(examOpen([pass('lesson-4-8')], 2)).toBe(false);
  });

  it('ignores exams for levels that do not exist', () => {
    expect(passedExam([pass('exam-11')], 11)).toBe(false);
    expect(passedExam([pass('exam-0')], 0)).toBe(false);
  });
});
