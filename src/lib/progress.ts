import { EXAM_MIN_CHARS, lessonsInLevel, levelOf } from '../data/exams';
import { lessons, PASS_ACCURACY, STEPS_PER_LESSON } from '../data/lessons';
import type { SavedResult } from './history';
import { parseExamKey, type ModeKey } from './modes';

export function personalBest(results: readonly SavedResult[], mode: ModeKey): SavedResult | undefined {
  let best: SavedResult | undefined;
  for (const r of results) {
    if (r.mode === mode && (!best || r.wpm > best.wpm)) best = r;
  }
  return best;
}

export function longestStreak(results: readonly SavedResult[]): number {
  const days = [...new Set(results.map((r) => dayStart(r.finishedAt)))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    const prev = days[i - 1];
    run = prev !== undefined && isNextDay(prev, days[i]!) ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

function dayStart(t: number): number {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isNextDay(a: number, b: number): boolean {
  const next = new Date(a);
  next.setDate(next.getDate() + 1);
  return next.getTime() === b;
}

/** Tests per day for the last `days` days, oldest first. */
export function activityByDay(results: readonly SavedResult[], days: number, now: Date = new Date()): number[] {
  const counts = new Map<number, number>();
  for (const r of results) counts.set(dayStart(r.finishedAt), (counts.get(dayStart(r.finishedAt)) ?? 0) + 1);
  const out: number[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    out.push(counts.get(cursor.getTime()) ?? 0);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** Consecutive days, ending today or yesterday, with at least one finished test. */
export function dayStreak(results: readonly SavedResult[], now: Date = new Date()): number {
  const days = new Set(results.map((r) => dayKey(new Date(r.finishedAt))));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export type StepRef = { lessonId: number; step: number };

/** A timed sprint could otherwise be passed by typing one letter and waiting. */
export const MIN_PASS_CHARS = 20;

export function passedStep(result: Pick<SavedResult, 'accuracy' | 'correctChars'>): boolean {
  return result.accuracy >= PASS_ACCURACY && result.correctChars >= MIN_PASS_CHARS;
}

const stepIndex = ({ lessonId, step }: StepRef) => (lessonId - 1) * STEPS_PER_LESSON + (step - 1);
const fromIndex = (i: number): StepRef => ({ lessonId: Math.floor(i / STEPS_PER_LESSON) + 1, step: (i % STEPS_PER_LESSON) + 1 });
const LAST_INDEX = lessons.length * STEPS_PER_LESSON - 1;

function furthestPassed(results: readonly SavedResult[]): number {
  let furthest = -1;
  for (const r of results) {
    const ref = parseLessonKey(r.mode);
    if (ref && passedStep(r)) furthest = Math.max(furthest, stepIndex(ref));
  }
  return furthest;
}

/**
 * The furthest step she can open: one past the furthest step she has passed, except that
 * a new level waits for the previous level's exam. Progress made before exams existed
 * stays open; those levels just show their exam as still to take.
 */
export function unlockedStep(results: readonly SavedResult[]): StepRef {
  const furthest = furthestPassed(results);
  const next = Math.min(furthest + 1, LAST_INDEX);
  if (furthest >= 0 && next > furthest) {
    const level = levelOf(fromIndex(furthest).lessonId)!;
    const crosses = levelOf(fromIndex(next).lessonId) !== level;
    // A try at the next lesson means it was already open before exams existed.
    const tried = results.some((r) => { const ref = parseLessonKey(r.mode); return ref !== null && stepIndex(ref) === next; });
    if (crosses && !tried && !passedExam(results, level)) return fromIndex(furthest);
  }
  return fromIndex(next);
}

export function examPassed(result: Pick<SavedResult, 'accuracy' | 'correctChars'>): boolean {
  return result.accuracy >= PASS_ACCURACY && result.correctChars >= EXAM_MIN_CHARS;
}

export function passedExam(results: readonly SavedResult[], level: number): boolean {
  return results.some((r) => parseExamKey(r.mode) === level && examPassed(r));
}

/** An exam opens once the last practice of its level has been passed. */
export function examOpen(results: readonly SavedResult[], level: number): boolean {
  const last = lessonsInLevel(level).at(-1);
  return last !== undefined && furthestPassed(results) >= stepIndex({ lessonId: last.id, step: STEPS_PER_LESSON });
}

export function isUnlocked(ref: StepRef, unlocked: StepRef): boolean {
  return stepIndex(ref) <= stepIndex(unlocked);
}

/** Steps of one lesson she has passed at least once. */
export function passedStepsOf(results: readonly SavedResult[], lessonId: number): Set<number> {
  const passed = new Set<number>();
  for (const r of results) {
    const ref = parseLessonKey(r.mode);
    if (ref?.lessonId === lessonId && passedStep(r)) passed.add(ref.step);
  }
  return passed;
}

export type LessonStatus = { passedSteps: number; bestAccuracy: number | undefined; state: 'done' | 'current' | 'locked' };

export function lessonStatus(results: readonly SavedResult[], lessonId: number, unlocked: StepRef): LessonStatus {
  const passed = passedStepsOf(results, lessonId);
  let bestAccuracy: number | undefined;
  for (const r of results) {
    if (parseLessonKey(r.mode)?.lessonId === lessonId) bestAccuracy = Math.max(bestAccuracy ?? 0, r.accuracy);
  }
  const done = passed.size === STEPS_PER_LESSON;
  const state = done ? 'done' : isUnlocked({ lessonId, step: 1 }, unlocked) ? 'current' : 'locked';
  return { passedSteps: passed.size, bestAccuracy, state };
}

export function parseLessonKey(key: ModeKey): StepRef | null {
  const m = /^lesson-(\d+)-(\d+)$/.exec(key);
  if (!m) return null;
  const ref = { lessonId: Number(m[1]), step: Number(m[2]) };
  const valid = ref.lessonId >= 1 && ref.lessonId <= lessons.length && ref.step >= 1 && ref.step <= STEPS_PER_LESSON;
  return valid ? ref : null;
}

export function nextStep(ref: StepRef): StepRef | null {
  const i = stepIndex(ref);
  return i >= LAST_INDEX ? null : fromIndex(i + 1);
}
