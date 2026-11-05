import { findLesson, keysUpTo, lessons, lessonWordPool } from '../data/lessons';
import { notes } from '../data/notes';
import { packs } from '../data/packs';
import { commonWords } from '../data/words';
import type { Selection } from '../lib/modes';
import type { StepRef } from '../lib/progress';
import { lessonDrill, weakKeyDrill } from './lessonWords';
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

export function wordSource(selection: Selection, unlocked: StepRef, random: Random = Math.random): (count: number) => string[] {
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
        while (out.length < want) out.push(...lessonDrill(lesson, 2, { words, passages: [] }, random));
        return out.slice(0, want);
      };
    }
    case 'lesson': {
      const lesson = findLesson(selection.lessonId);
      if (!lesson) throw new Error(`Unknown lesson ${selection.lessonId}`);
      const passages = packs.filter((p) => p.id !== 'from-me').flatMap((p) => p.passages);
      return () => lessonDrill(lesson, selection.step, { words: allWords, passages }, random);
    }
    case 'weak': {
      const learned = practiceWords(practiceLevel(unlocked));
      return () => weakKeyDrill(learned.length >= 4 ? learned : allWords, selection.keys, 25, random);
    }
    case 'pack': {
      const pack = packs.find((p) => p.id === selection.packId);
      const passages = (pack?.passages ?? []).filter((p) => splitText(p).length > 0);
      const usable = passages.length > 0 ? passages : [commonWords.slice(0, 25).join(' ')];
      return () => splitText(usable[Math.floor(random() * usable.length)]!);
    }
    case 'note': {
      const note = notes.find((n) => n.id === selection.noteId);
      const words = note ? splitText(note.text) : [];
      return () => (words.length > 0 ? words : commonWords.slice(0, 10));
    }
  }
}
