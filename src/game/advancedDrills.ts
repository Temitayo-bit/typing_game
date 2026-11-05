import { ADVANCED_KINDS, STEP_WORDS, STEPS_PER_LESSON, type AdvancedKind, type Lesson } from '../data/lessons';
import { commonWords } from '../data/words';
import { splitText, type Random } from './words';

export function isAdvanced(lesson: Lesson): lesson is Lesson & { kind: AdvancedKind } {
  return (ADVANCED_KINDS as readonly string[]).includes(lesson.kind);
}

/**
 * Practice text for the lessons after every key is learned. Like the letter
 * lessons, early steps isolate the new skill and later steps blend it into
 * real typing, ending with a longer checkpoint.
 */
export function advancedDrill(lesson: Lesson & { kind: AdvancedKind }, step: number, random: Random = Math.random): string[] {
  const last = step === STEPS_PER_LESSON;
  const count = last ? STEP_WORDS + 10 : STEP_WORDS;
  const progress = (step - 1) / (STEPS_PER_LESSON - 1);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(random() * xs.length)]!;
  const words = () => need(lesson.words, lesson, 'words');

  switch (lesson.kind) {
    case 'patterns': {
      const focus = need(lesson.focus, lesson, 'focus');
      const vocab = words();
      // Chunks first, so the pair becomes one movement, then the words that use it.
      if (step <= 2) return Array.from({ length: count }, (_, i) => (i % 3 === 2 ? pick(vocab) : pick(focus).repeat(2)));
      return Array.from({ length: count }, () => (random() < 0.1 * (1 - progress) ? pick(focus) : pick(vocab)));
    }
    case 'symbols': {
      const vocab = words();
      const symbolChance = step <= 2 ? 0.7 : 0.6 - progress * 0.2;
      return Array.from({ length: count }, () => (random() < symbolChance ? pick(vocab) : pick(SHORT_WORDS)));
    }
    case 'speed': {
      const vocab = words();
      // Repeating a word three times builds the chunk; later steps flow freely.
      if (step <= 2) return Array.from({ length: Math.ceil(count / 3) }, () => pick(vocab)).flatMap((w) => [w, w, w]).slice(0, count);
      return Array.from({ length: count }, () => pick(vocab));
    }
    case 'reading': {
      const passages = need(lesson.passages, lesson, 'passages');
      // Each early practice gets its own passage; the checkpoint strings two together.
      const first = step <= passages.length ? passages[step - 1]! : pick(passages);
      const others = passages.filter((p) => p !== first);
      const text = last && others.length > 0 ? `${first} ${pick(others)}` : first;
      return splitText(text);
    }
  }
}

const SHORT_WORDS = commonWords.filter((w) => w.length <= 5);

function need<T>(value: readonly T[] | undefined, lesson: Lesson, field: string): readonly T[] {
  if (!value || value.length === 0) throw new Error(`Lesson ${lesson.id} needs ${field}`);
  return value;
}
