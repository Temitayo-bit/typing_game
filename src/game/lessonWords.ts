import { keysUpTo, punctuationPool, STEP_WORDS, STEPS_PER_LESSON, type Lesson } from '../data/lessons';
import type { Random } from './words';

export type DrillSources = { words: readonly string[]; passages: readonly string[] };

/** Builds the text for one practice step of a lesson. Steps get gradually closer to real typing. */
export function lessonDrill(lesson: Lesson, step: number, sources: DrillSources, random: Random = Math.random): string[] {
  const allowed = keysUpTo(lesson.id);
  const letters = new Set([...allowed].filter((k) => !/[0-9]/.test(k)));
  const words = unique(sources.words.filter((w) => [...w].every((c) => letters.has(c))));
  const last = step === STEPS_PER_LESSON;
  const count = last ? STEP_WORDS + 5 : STEP_WORDS;
  // 0 on the first step, 1 on the checkpoint: drills drift from drills to real typing.
  const progress = (step - 1) / (STEPS_PER_LESSON - 1);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(random() * xs.length)]!;

  switch (lesson.kind) {
    case 'keys': {
      const withNew = words.filter((w) => lesson.newKeys.some((k) => w.includes(k)));
      if (step <= 3) return letterGroups(allowed, lesson.newKeys, 0.85 - step * 0.1, count, random);
      const focusWords = !last && step % 2 === 1 && withNew.length >= 4;
      return mix(focusWords ? withNew : words, () => letterGroups(allowed, lesson.newKeys, 0.5, 1, random)[0]!, 0.7, count, random);
    }
    case 'shift': {
      const capitalChance = 0.3 + progress * 0.5;
      return Array.from({ length: count }, () => {
        const w = pick(words);
        return random() < capitalChance ? w[0]!.toUpperCase() + w.slice(1) : w;
      });
    }
    case 'punctuation': {
      const punctChance = 0.3 + progress * 0.4;
      return Array.from({ length: count }, () => (random() < punctChance ? pick(punctuationPool) : pick(words)));
    }
    case 'numbers': {
      const digits = [...allowed].filter((k) => /[0-9]/.test(k));
      return Array.from({ length: count }, () => {
        if (random() < 0.4 + progress * 0.2) return pick(words);
        const length = 1 + Math.floor(random() * (2 + progress * 2));
        return Array.from({ length }, () => pick(digits)).join('');
      });
    }
    case 'sentences': {
      const passages = sources.passages.length > 0 ? sources.passages : [words.slice(0, 20).join(' ')];
      const passage = pick(passages).split(/\s+/).filter(Boolean);
      // The final lesson strings two passages together for a longer run.
      return lesson.id === 20 && last ? [...passage, ...pick(passages).split(/\s+/).filter(Boolean)] : passage;
    }
  }
}

function letterGroups(
  allowed: ReadonlySet<string>,
  focus: readonly string[],
  focusChance: number,
  count: number,
  random: Random,
): string[] {
  if (allowed.size === 0) throw new Error('A lesson drill needs at least one unlocked key');
  const usable = [...allowed];
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(random() * xs.length)]!;
  return Array.from({ length: count }, () => {
    const length = 2 + Math.floor(random() * 3);
    let group = '';
    for (let j = 0; j < length; j++) group += focus.length > 0 && random() < focusChance ? pick(focus) : pick(usable);
    return group;
  });
}

function mix(words: readonly string[], fallback: () => string, wordChance: number, count: number, random: Random): string[] {
  const pick = () => words[Math.floor(random() * words.length)]!;
  return Array.from({ length: count }, () => (words.length >= 4 && random() < wordChance ? pick() : fallback()));
}

function unique(xs: readonly string[]): string[] {
  return [...new Set(xs)];
}

/** Words that lean on the keys she misses most, for a quick targeted drill. */
export function weakKeyDrill(words: readonly string[], keys: readonly string[], count: number, random: Random = Math.random): string[] {
  const letters = keys.filter((k) => k.length === 1 && k !== ' ');
  const matching = unique(words.filter((w) => letters.some((k) => w.includes(k))));
  const pool = matching.length >= 4 ? matching : unique(words);
  if (pool.length === 0) throw new Error('No words to build a drill from');
  return Array.from({ length: count }, () => pool[Math.floor(random() * pool.length)]!);
}
