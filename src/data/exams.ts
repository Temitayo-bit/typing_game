import { lessons, levels } from './lessons';

/** One exam closes each level. It is timed so later levels don't turn into a 10-minute passage. */
export const EXAM_SECONDS = 90;

/** Share of an exam built from the level just finished; the rest revisits earlier levels. */
export const NEW_SHARE = 0.6;

/** Speeds that earn one, two and three stars. Speed never fails an exam. */
const STAR_WPM: Record<number, readonly [number, number, number]> = {
  1: [8, 12, 16],
  2: [10, 15, 20],
  3: [12, 18, 24],
  4: [12, 18, 24],
  5: [15, 20, 26],
  6: [18, 25, 32],
  7: [15, 20, 26],
  8: [22, 30, 38],
  9: [20, 27, 35],
  10: [22, 30, 40],
};

export function starTargets(level: number): readonly [number, number, number] {
  const t = STAR_WPM[level];
  if (!t) throw new Error(`No exam for level ${level}`);
  return t;
}

export function starsFor(level: number, wpm: number): 0 | 1 | 2 | 3 {
  return starTargets(level).filter((t) => wpm >= t).length as 0 | 1 | 2 | 3;
}

export function lessonsInLevel(level: number) {
  return lessons.filter((l) => l.level === level);
}

export function levelOf(lessonId: number): number | undefined {
  return lessons.find((l) => l.id === lessonId)?.level;
}

export function findLevel(id: number) {
  return levels.find((l) => l.id === id);
}
