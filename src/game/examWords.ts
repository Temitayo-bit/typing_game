import { drillFor } from '../data/drills';
import { lessonsInLevel, NEW_SHARE } from '../data/exams';
import { lessons, STEPS_PER_LESSON, type Lesson } from '../data/lessons';
import { lessonDrill, type DrillSources } from './lessonWords';
import type { Random } from './words';

/** Long passages are cut so one lesson can't fill the whole exam and the mix still holds. */
const CHUNK_WORDS = 24;

/**
 * Text for a level exam: chunks of each lesson's checkpoint drill, mostly from this level
 * and the rest from earlier ones. A chunk only uses keys taught by its own lesson, so the
 * whole exam stays inside what she has learned.
 */
export function examWords(level: number, count: number, sources: DrillSources, random: Random = Math.random): string[] {
  const current = lessonsInLevel(level);
  if (current.length === 0) throw new Error(`No lessons in level ${level}`);
  // The first lessons have no vowels, so their checkpoint is letter groups like "fjj"; once
  // real words exist, revisiting those adds nothing an earlier lesson's words don't cover.
  const earlier = lessons.filter((l) => l.level < level && drillFor(l, STEPS_PER_LESSON).type !== 'shuffle');
  const out: string[] = [];
  while (out.length < count) {
    const pool = earlier.length > 0 && random() >= NEW_SHARE ? earlier : current;
    out.push(...chunk(pick(pool, random), sources, random));
  }
  return out.slice(0, count);
}

function chunk(lesson: Lesson, sources: DrillSources, random: Random): string[] {
  const words = lessonDrill(lesson, STEPS_PER_LESSON, sources, random);
  if (words.length === 0) throw new Error(`Lesson ${lesson.id} has no drill text`);
  if (words.length <= CHUNK_WORDS) return words;
  const start = Math.floor(random() * (words.length - CHUNK_WORDS + 1));
  return words.slice(start, start + CHUNK_WORDS);
}

function pick<T>(list: readonly T[], random: Random): T {
  return list[Math.floor(random() * list.length)]!;
}
