import { findLesson, keysUpTo, lessons, lessonWordPool } from '../data/lessons';
import { notes } from '../data/notes';
import { packs } from '../data/packs';
import { commonWords } from '../data/words';
import type { Selection } from '../lib/modes';
import type { StepRef } from '../lib/progress';
import { examWords } from './examWords';
import { lessonDrill, weakKeyDrill } from './lessonWords';
import { unseen } from '../lib/seen';
import { pickWords, splitText, type Random } from './words';

const allWords = [...new Set([...commonWords, ...lessonWordPool])];
const MIN_PRACTICE_WORDS = 15;

export type PracticeLevel = { label: string; letters: Set<string> | null };

/**
 * Practice tests only use keys she has learned so far, so they grow with her
 * lessons. Once every letter is unlocked, practice uses the full word list.
 */
export function practiceLevel(unlocked: StepRef): PracticeLevel {
  const keys = keysUpTo(unlocked.lessonId);
  const allLetters = [...'abcdefghijklmnopqrstuvwxyz'].every((c) => keys.has(c));
  if (allLetters) return { label: 'all keys', letters: null };
  const letters = new Set([...keys].filter((k) => /[a-z]/.test(k)));
  return { label: `beginner · ${[...letters].join(' ')}`, letters };
}

export function practiceWords(level: PracticeLevel): string[] {
  if (!level.letters) return commonWords;
  const letters = level.letters;
  return allWords.filter((w) => [...w].every((c) => letters.has(c)));
}

export function wordSource(
  selection: Selection,
  unlocked: StepRef,
  random: Random = Math.random,
  weakKeys: readonly string[] = [],
  /** Ids of passages already typed. Read on every call, so the caller can add to it as tests finish. */
  seen: ReadonlySet<string> = new Set(),
): (count: number) => string[] {
  switch (selection.kind) {
    case 'time':
    case 'words': {
      const fixed = selection.kind === 'words' ? selection.count : undefined;
      const words = practiceWords(practiceLevel(unlocked));
      if (words.length >= MIN_PRACTICE_WORDS) return (count) => pickWords(words, fixed ?? count, random);
      // Too few real words yet: practise the current lesson's drills instead.
      const lesson = findLesson(unlocked.lessonId) ?? lessons[0]!;
      return (count) => {
        const want = fixed ?? count;
        const out: string[] = [];
        while (out.length < want) {
          const drill = lessonDrill(lesson, 3, { words, passages: [] }, random);
          if (drill.length === 0) throw new Error(`Lesson ${lesson.id} has no drill text`);
          out.push(...drill);
        }
        return out.slice(0, want);
      };
    }
    case 'lesson': {
      const lesson = findLesson(selection.lessonId);
      if (!lesson) throw new Error(`Unknown lesson ${selection.lessonId}`);
      const passages = packs.flatMap((p) => p.passages);
      return () => lessonDrill(lesson, selection.step, { words: allWords, passages, weakKeys, seen }, random);
    }
    case 'exam': {
      const passages = packs.flatMap((p) => p.passages);
      return (count) => examWords(selection.level, count, { words: allWords, passages, weakKeys, seen }, random);
    }
    case 'weak': {
      const learned = practiceWords(practiceLevel(unlocked));
      return () => weakKeyDrill(learned.length >= 4 ? learned : allWords, selection.keys, 25, random);
    }
    case 'pack': {
      const pack = packs.find((p) => p.id === selection.packId);
      if (!pack) throw new Error(`Unknown pack ${selection.packId}`);
      const passages = pack.passages.filter((p) => splitText(p).length > 0);
      const usable = passages.length > 0 ? passages : [commonWords.slice(0, 25).join(' ')];
      // Walk through the pack from a random start, so "Next test" always brings a different passage,
      // skipping ones she has typed before until the pack runs out of new ones.
      let next = Math.floor(random() * usable.length);
      return () => {
        const fresh = unseen(usable, seen);
        let i = next;
        while (!fresh.includes(usable[i % usable.length]!)) i++;
        next = i + 1;
        return splitText(usable[i % usable.length]!);
      };
    }
    case 'note': {
      const note = notes.find((n) => n.id === selection.noteId);
      if (!note) throw new Error(`Unknown note ${selection.noteId}`);
      const words = splitText(note.text);
      return () => (words.length > 0 ? words : commonWords.slice(0, 10));
    }
  }
}
