import { describe, expect, it } from 'vitest';
import { levels, STEPS_PER_LESSON } from '../data/lessons';
import { certificateEarned, growthSeries, levelProgress, nextUp, typicalWpm } from './exams';
import type { SavedResult } from './history';
import { unlockedStep } from './progress';

function result(over: Partial<SavedResult>): SavedResult {
  return {
    wpm: 30, rawWpm: 32, accuracy: 95, correctChars: 100, typedChars: 105, durationMs: 30_000,
    missedKeys: {}, wpmBySecond: [], mode: 'time-30', finishedAt: 0, ...over,
  };
}

const lessonDone = (id: number) => Array.from({ length: STEPS_PER_LESSON }, (_, i) => result({ mode: `lesson-${id}-${i + 1}` }));
const level1 = [1, 2, 3, 4].flatMap(lessonDone);

describe('levelProgress', () => {
  it('walks from learning to exam-ready to passed, with stars from the fastest pass', () => {
    const start = levelProgress([], unlockedStep([]));
    expect(start[0]).toMatchObject({ level: 1, state: 'learning', lessonsDone: 0, firstLesson: 1, lastLesson: 4 });
    expect(start[1]!.state).toBe('locked');

    expect(levelProgress(level1, unlockedStep(level1))[0]).toMatchObject({ state: 'exam-ready', lessonsDone: 4 });

    const tries = [...level1, result({ mode: 'exam-1', wpm: 13 }), result({ mode: 'exam-1', wpm: 30, accuracy: 70 })];
    const after = levelProgress(tries, unlockedStep(tries));
    expect(after[0]).toMatchObject({ state: 'passed', stars: 2 });
    expect(after[0]!.best?.wpm).toBe(13);
    expect(after[1]!.state).toBe('learning');
  });

  it('shows an exam to take for levels passed before exams existed', () => {
    const rs = [...level1, ...lessonDone(5)];
    const p = levelProgress(rs, unlockedStep(rs));
    expect(p[0]!.state).toBe('exam-ready');
    expect(p[1]!.state).toBe('learning');
  });
});

describe('nextUp', () => {
  it('points at the exam when it is the only way forward', () => {
    expect(nextUp(level1, unlockedStep(level1))).toEqual({ kind: 'exam', level: 1 });
    const passed = [...level1, result({ mode: 'exam-1' })];
    expect(nextUp(passed, unlockedStep(passed))).toEqual({ kind: 'lesson', lessonId: 5 });
    expect(nextUp([], unlockedStep([]))).toEqual({ kind: 'lesson', lessonId: 1 });
  });

  it('keeps lessons first when an old exam is still owed', () => {
    const rs = [...level1, ...lessonDone(5).slice(0, 2)];
    expect(nextUp(rs, unlockedStep(rs))).toEqual({ kind: 'lesson', lessonId: 5 });
  });
});

describe('certificateEarned', () => {
  it('needs every level exam', () => {
    const all = levels.map((l) => result({ mode: `exam-${l.id}` }));
    expect(certificateEarned(all)).toBe(true);
    expect(certificateEarned(all.slice(1))).toBe(false);
  });
});

describe('typicalWpm', () => {
  it('is the median of the last 10 practice tests of 30 seconds or more', () => {
    const old = Array.from({ length: 20 }, (_, i) => result({ wpm: 10, finishedAt: i }));
    const recent = [20, 22, 24, 26, 28, 30, 32, 34, 36, 100].map((wpm, i) => result({ wpm, finishedAt: 100 + i }));
    expect(typicalWpm([...old, ...recent])).toEqual({ wpm: 29, of: 10 });
  });

  it('leaves out lesson practices, exams and short bursts', () => {
    const rs = [
      result({ wpm: 20, finishedAt: 1 }),
      result({ wpm: 22, finishedAt: 2 }),
      result({ wpm: 24, finishedAt: 3 }),
      result({ wpm: 90, mode: 'lesson-1-1', finishedAt: 4 }),
      result({ wpm: 90, mode: 'exam-1', durationMs: 90_000, finishedAt: 5 }),
      result({ wpm: 90, mode: 'time-15', durationMs: 15_000, finishedAt: 6 }),
    ];
    expect(typicalWpm(rs)).toEqual({ wpm: 22, of: 3 });
  });

  it('keeps low-accuracy tests, since wpm already only counts correct letters', () => {
    const rs = [result({ wpm: 10, accuracy: 60 }), result({ wpm: 20 }), result({ wpm: 30 })];
    expect(typicalWpm(rs)?.wpm).toBe(20);
  });

  it('waits for 3 tests', () => {
    expect(typicalWpm([result({}), result({})])).toBeUndefined();
  });
});

describe('growthSeries', () => {
  it('lists comparable tests and exams in order, marking passed exams', () => {
    const rs = [
      result({ mode: 'exam-1', wpm: 15, finishedAt: 3, durationMs: 90_000 }),
      result({ wpm: 12, finishedAt: 1 }),
      result({ mode: 'exam-1', wpm: 16, accuracy: 70, finishedAt: 2, durationMs: 90_000 }),
      result({ mode: 'lesson-2-2', wpm: 50, finishedAt: 4 }),
    ];
    expect(growthSeries(rs)).toEqual([
      { wpm: 12, exam: false },
      { wpm: 16, exam: false },
      { wpm: 15, exam: true },
    ]);
  });
});
