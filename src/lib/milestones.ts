import { lessons, STEPS_PER_LESSON } from '../data/lessons';
import type { SavedResult } from './history';
import { isSpeedTest } from './modes';
import { longestStreak, passedStepsOf } from './progress';

export type Milestone = { id: string; title: string };

type Rule = Milestone & { reached: (results: readonly SavedResult[]) => boolean };

const speed = (results: readonly SavedResult[]) => results.filter((r) => isSpeedTest(r.mode));

const rules: Rule[] = [
  { id: 'first-test', title: 'Your very first test!', reached: (rs) => rs.length > 0 },
  ...[20, 30, 40, 50, 60, 70].map((wpm) => ({
    id: `wpm-${wpm}`,
    title: `First time over ${wpm} wpm`,
    reached: (rs: readonly SavedResult[]) => speed(rs).some((r) => r.wpm >= wpm),
  })),
  { id: 'accuracy-95', title: 'A 95% accuracy run', reached: (rs) => speed(rs).some((r) => r.accuracy >= 95) },
  { id: 'accuracy-100', title: 'A perfect, mistake-free run', reached: (rs) => speed(rs).some((r) => r.accuracy === 100) },
  ...lessons.map((l) => ({
    id: `lesson-${l.id}`,
    title: `Lesson ${l.id} complete: ${l.title}`,
    reached: (rs: readonly SavedResult[]) => passedStepsOf(rs, l.id).size === STEPS_PER_LESSON,
  })),
  ...[3, 7, 14, 30].map((days) => ({
    id: `streak-${days}`,
    title: `${days} days in a row`,
    reached: (rs: readonly SavedResult[]) => longestStreak(rs) >= days,
  })),
];

/** Milestones this result reached for the first time. Derived from history, so each shows exactly once. */
export function newMilestones(before: readonly SavedResult[], after: readonly SavedResult[]): Milestone[] {
  return rules.filter((r) => !r.reached(before) && r.reached(after)).map(({ id, title }) => ({ id, title }));
}

export function reachedMilestones(results: readonly SavedResult[]): Milestone[] {
  return rules.filter((r) => r.reached(results)).map(({ id, title }) => ({ id, title }));
}
