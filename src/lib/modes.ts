import { drillFor, type Drill } from '../data/drills';
import { EXAM_SECONDS, findLevel } from '../data/exams';
import { findLesson } from '../data/lessons';
import type { Mode, Rules } from '../game/engine';

export type Selection =
  | { kind: 'time'; seconds: number }
  | { kind: 'words'; count: number }
  | { kind: 'pack'; packId: string }
  | { kind: 'lesson'; lessonId: number; step: number }
  | { kind: 'weak'; keys: string[] }
  | { kind: 'note'; noteId: string }
  | { kind: 'exam'; level: number };

export type LessonKey = `lesson-${number}-${number}`;
export type ExamKey = `exam-${number}`;

export type ModeKey =
  | `time-${number}`
  | `words-${number}`
  | `pack-${string}`
  | LessonKey
  | ExamKey
  | 'weak-keys'
  | `note-${string}`;

export function selectionKey(s: Selection): ModeKey {
  switch (s.kind) {
    case 'time':
      return `time-${s.seconds}`;
    case 'words':
      return `words-${s.count}`;
    case 'pack':
      return `pack-${s.packId}`;
    case 'lesson':
      return lessonKey(s.lessonId, s.step);
    case 'weak':
      return 'weak-keys';
    case 'note':
      return `note-${s.noteId}`;
    case 'exam':
      return examKey(s.level);
  }
}

export function lessonKey(lessonId: number, step: number): LessonKey {
  return `lesson-${lessonId}-${step}`;
}

export function examKey(level: number): ExamKey {
  return `exam-${level}`;
}

/** The level an exam result belongs to, or null if the key isn't a real exam. */
export function parseExamKey(key: ModeKey): number | null {
  const m = /^exam-([1-9]\d*)$/.exec(key);
  const level = m ? Number(m[1]) : NaN;
  return findLevel(level) ? level : null;
}

export function isLessonKey(key: ModeKey): key is LessonKey {
  return key.startsWith('lesson-');
}

export function isModeKey(value: unknown): value is ModeKey {
  return (
    typeof value === 'string' &&
    /^(?:(?:time|words|exam)-\d+|lesson-\d+-\d+|weak-keys|(?:pack|note)-[a-z0-9-]+)$/.test(value)
  );
}

export function engineMode(s: Selection): Mode {
  if (s.kind === 'time') return { kind: 'time', seconds: s.seconds };
  if (s.kind === 'exam') return { kind: 'time', seconds: EXAM_SECONDS };
  const seconds = lessonDrill(s)?.seconds;
  return seconds ? { kind: 'time', seconds } : { kind: 'text' };
}

/** The lesson practice behind a selection, if it is one. */
export function lessonDrill(s: Selection): Drill | undefined {
  if (s.kind !== 'lesson') return undefined;
  const lesson = findLesson(s.lessonId);
  return lesson ? drillFor(lesson, s.step) : undefined;
}

export function testRules(s: Selection): Rules {
  const drill = lessonDrill(s);
  if (!drill) return {};
  const { noBackspace, stopOnError } = drill;
  return { noBackspace, stopOnError };
}

/** Practice results that count towards speed records (lessons and drills are excluded). */
export function isSpeedTest(key: ModeKey): boolean {
  return key.startsWith('time-') || key.startsWith('words-') || key.startsWith('pack-');
}

export function modeLabel(key: ModeKey): string {
  if (key.startsWith('time-')) return `${key.slice(5)}s`;
  if (key.startsWith('words-')) return `${key.slice(6)} words`;
  if (key.startsWith('lesson-')) {
    const [, lesson, step] = key.split('-');
    return `lesson ${lesson}.${step}`;
  }
  if (key.startsWith('exam-')) return `exam ${key.slice(5)}`;
  if (key === 'weak-keys') return 'key drill';
  if (key.startsWith('note-')) return 'note';
  return key.slice(5).replace(/-/g, ' ');
}
