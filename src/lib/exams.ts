import { lessonsInLevel, starsFor } from '../data/exams';
import { levels, STEPS_PER_LESSON } from '../data/lessons';
import type { SavedResult } from './history';
import { isSpeedTest, parseExamKey } from './modes';
import { examOpen, examPassed, isUnlocked, passedExam, passedStepsOf, type StepRef } from './progress';

export type LevelState = 'passed' | 'exam-ready' | 'learning' | 'locked';

export type LevelProgress = {
  level: number;
  title: string;
  firstLesson: number;
  lastLesson: number;
  lessonsDone: number;
  state: LevelState;
  /** Fastest passing try, which is the one that earns stars. */
  best?: SavedResult;
  stars: 0 | 1 | 2 | 3;
};

export function levelProgress(results: readonly SavedResult[], unlocked: StepRef): LevelProgress[] {
  return levels.map(({ id, title }) => {
    const ls = lessonsInLevel(id);
    const lessonsDone = ls.filter((l) => passedStepsOf(results, l.id).size === STEPS_PER_LESSON).length;
    const best = bestPass(results, id);
    const state: LevelState = passedExam(results, id)
      ? 'passed'
      : examOpen(results, id)
        ? 'exam-ready'
        : isUnlocked({ lessonId: ls[0]!.id, step: 1 }, unlocked)
          ? 'learning'
          : 'locked';
    return { level: id, title, firstLesson: ls[0]!.id, lastLesson: ls.at(-1)!.id, lessonsDone, state, best, stars: best ? starsFor(id, best.wpm) : 0 };
  });
}

function bestPass(results: readonly SavedResult[], level: number): SavedResult | undefined {
  let best: SavedResult | undefined;
  for (const r of results) {
    if (parseExamKey(r.mode) === level && examPassed(r) && (!best || r.wpm > best.wpm)) best = r;
  }
  return best;
}

export type NextUp = { kind: 'exam'; level: number } | { kind: 'lesson'; lessonId: number };

/** What "continue" should open: the exam when it is the only thing between her and the next level. */
export function nextUp(results: readonly SavedResult[], unlocked: StepRef): NextUp {
  const level = levels.find((l) => lessonsInLevel(l.id).some((x) => x.id === unlocked.lessonId))?.id;
  if (level !== undefined && examOpen(results, level) && !passedExam(results, level) && unlocked.lessonId === lessonsInLevel(level).at(-1)?.id) {
    return { kind: 'exam', level };
  }
  return { kind: 'lesson', lessonId: unlocked.lessonId };
}

export function certificateEarned(results: readonly SavedResult[]): boolean {
  return levels.every((l) => passedExam(results, l.id));
}

/** Short bursts run fast and lesson drills use only a few keys, so neither says how fast she types. */
export const COMPARABLE_MS = 30_000;
const TYPICAL_OF = 10;
const MIN_FOR_TYPICAL = 3;

export function comparableTests(results: readonly SavedResult[]): SavedResult[] {
  return results.filter((r) => isSpeedTest(r.mode) && r.durationMs >= COMPARABLE_MS - 500).sort((a, b) => a.finishedAt - b.finishedAt);
}

/**
 * Her speed right now: the median of her last 10 comparable tests. An all-time average is held
 * down by her first weeks; the median shrugs off one lucky or awful test. WPM already counts
 * only correct characters, so sloppy tests aren't filtered out, which would flatter the number.
 */
export function typicalWpm(results: readonly SavedResult[]): { wpm: number; of: number } | undefined {
  const recent = comparableTests(results).slice(-TYPICAL_OF);
  if (recent.length < MIN_FOR_TYPICAL) return undefined;
  return { wpm: median(recent.map((r) => r.wpm)), of: recent.length };
}

export function firstComparable(results: readonly SavedResult[]): SavedResult | undefined {
  return comparableTests(results)[0];
}

/** Comparable tests and exam tries in time order, for the growth chart. */
export function growthSeries(results: readonly SavedResult[], limit = 40): { wpm: number; exam: boolean }[] {
  return results
    .filter((r) => parseExamKey(r.mode) !== null || (isSpeedTest(r.mode) && r.durationMs >= COMPARABLE_MS - 500))
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .slice(-limit)
    .map((r) => ({ wpm: r.wpm, exam: parseExamKey(r.mode) !== null && examPassed(r) }));
}

function median(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}
