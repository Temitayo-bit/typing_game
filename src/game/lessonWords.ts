import { drillFor, type DrillType } from '../data/drills';
import * as text from '../data/drillText';
import { keysUpTo, lessons, punctuationPool, STEP_WORDS, STEPS_PER_LESSON, type Lesson } from '../data/lessons';
import { unseen } from '../lib/seen';
import { pickWords, splitText, type Random } from './words';

export type DrillSources = {
  words: readonly string[];
  passages: readonly string[];
  /** Keys she has missed most often, worst first. */
  weakKeys?: readonly string[];
  /** Ids of passages already typed; those wait until every other passage has had a turn. */
  seen?: ReadonlySet<string>;
};

/** Lesson-specific word lists, patterns or passages a lesson may carry on top of the shared pools. */
function lessonList(lesson: Lesson, field: 'words' | 'passages' | 'focus'): string[] {
  const value: unknown = (lesson as Partial<Record<string, unknown>>)[field];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

const RIGHT_HAND = new Set('yuiophjklnm');

type Ctx = {
  lesson: Lesson;
  count: number;
  random: Random;
  typeable: (s: string) => boolean;
  /** Every learned key, letters and symbols. */
  allowed: string[];
  /** The lesson's own word list, filtered to what she can type. */
  ownWords: string[];
  /** What this lesson is about: its new keys, or every learned key when it has none. */
  focus: string[];
  digits: string[];
  words: string[];
  focusWords: string[];
  passages: string[];
  weakKeys: string[];
};

/** Builds the text for one practice of a lesson. Each practice is a different kind of exercise. */
export function lessonDrill(lesson: Lesson, step: number, sources: DrillSources, random: Random = Math.random): string[] {
  const drill = drillFor(lesson, step);
  const ctx = context(lesson, step, sources, random);
  const out = build(drill.type, ctx);
  return out.length > 0 ? out : fallbackWords(ctx);
}

function context(lesson: Lesson, step: number, sources: DrillSources, random: Random): Ctx {
  const keys = keysUpTo(lesson.id);
  const capitals = lessons.some((l) => l.kind === 'shift' && l.id <= lesson.id);
  const chars = new Set([' ', ...keys]);
  if (capitals) for (const k of keys) if (/[a-z]/.test(k)) chars.add(k.toUpperCase());
  const typeable = (s: string) => s.length > 0 && [...s].every((c) => chars.has(c));

  const curated = unique(lessonList(lesson, 'words').filter(typeable));
  const words = curated.length >= 8 ? curated : unique([...curated, ...sources.words.filter(typeable)]);
  const allowed = [...keys];
  const chunks = lessonList(lesson, 'focus').filter(typeable);
  const focus = chunks.length > 0 ? chunks : lesson.newKeys.filter((k) => keys.has(k));
  const focusKeys = focus.length > 0 ? focus : allowed.filter((k) => /[a-z]/.test(k));
  // Once capitals and full stops are learned, shared passages read as proper sentences.
  const tidy = (p: string) => (capitals && keys.has('.') ? sentenceCase(p) : p);
  const ownPassages = lessonList(lesson, 'passages').filter(typeable);
  return {
    lesson,
    ownWords: curated,
    count: step === STEPS_PER_LESSON ? STEP_WORDS + 5 : STEP_WORDS,
    random,
    typeable,
    allowed,
    focus: focusKeys.length > 0 ? focusKeys : allowed,
    digits: allowed.filter((k) => /[0-9]/.test(k)),
    words,
    focusWords: focus.length > 0 ? words.filter((w) => focus.some((k) => w.includes(k))) : words,
    passages: unseen(ownPassages.length > 0 ? ownPassages : sources.passages.map(tidy).filter(typeable), sources.seen ?? new Set()),
    // A capital only gets through once shift is learned (chars has it); weakKeyDrill capitalises words for it.
    weakKeys: unique((sources.weakKeys ?? []).filter((k) => k.length === 1 && k !== ' ' && chars.has(k))),
  };
}

function build(type: DrillType, c: Ctx): string[] {
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(c.random() * xs.length)]!;
  const fill = (make: () => string) => Array.from({ length: c.count }, make);
  switch (type) {
    case 'meet':
      // Round-robin so every new key gets its turn.
      return Array.from({ length: c.count }, (_, i) => c.focus[i % c.focus.length]!.repeat(2 + Math.floor(c.random() * 3)));
    case 'chunks':
      // A letter pattern on its own, then twice, then inside a word.
      return fill(() => {
        const chunk = pick(c.focus);
        const words = c.focusWords.filter((w) => w.includes(chunk));
        const r = c.random();
        return r < 0.4 ? chunk : r < 0.6 || words.length === 0 ? chunk + chunk : pick(words);
      });
    case 'pairs': {
      const old = c.allowed.filter((k) => !c.focus.includes(k) && (/[a-z]/.test(k) || c.lesson.kind === 'keys'));
      const others = old.length > 0 ? old : c.focus;
      const shapes = [(a: string, b: string) => a + b, (a: string, b: string) => b + a, (a: string, b: string) => a + a + b, (a: string, b: string) => a + b + a + b];
      return fill(() => pick(shapes)(pick(c.focus), pick(others)));
    }
    case 'shuffle':
      return letterGroups(c, 0.4);
    case 'tiny-words': {
      const tiny = c.focusWords.filter((w) => w.length <= 5);
      const pool = tiny.length >= 4 ? tiny : c.focusWords;
      return pool.length >= 4 ? pickWords(pool, c.count, c.random) : letterGroups(c, 0.6);
    }
    case 'echo': {
      const bases = echoBases(c);
      return Array.from({ length: Math.ceil(c.count / 3) }, () => pick(bases)).flatMap((w) => [w, w, w]);
    }
    case 'mixed-words':
      return mixedWords(c);
    case 'lesson-words':
      return c.ownWords.length >= 4 ? pickWords(c.ownWords, c.count, c.random) : mixedWords(c);
    case 'left-caps':
    case 'right-caps': {
      const rightHand = type === 'left-caps';
      const pool = c.words.filter((w) => /^[a-z]/.test(w) && RIGHT_HAND.has(w[0]!) === rightHand);
      return pool.length >= 4 ? pickWords(pool, c.count, c.random).map(capitalise).filter(c.typeable) : [];
    }
    case 'big-small':
      return c.words.length >= 4 ? pickWords(c.words, Math.ceil(c.count / 2), c.random).flatMap((w) => [w, capitalise(w)]).filter(c.typeable) : [];
    case 'names':
      return pickFrom(text.names, c);
    case 'title-case':
      return phrases(text.titles, c);
    case 'cap-sentences':
      return phrases(text.capitalSentences, c);
    case 'short-sentences':
      return phrases(text.capitalSentences.filter((s) => splitText(s).length <= 8), c);
    case 'contractions': {
      const pool = unique([...text.contractions, ...punctuationPool]).filter((w) => w.includes("'") && c.typeable(w));
      if (pool.length < 4) return [];
      return fill(() => (c.random() < 0.7 || c.words.length === 0 ? pick(pool) : pick(c.words)));
    }
    case 'questions':
      return phrases(text.questions, c);
    case 'commas':
      return phrases(text.commaPhrases, c);
    case 'quotes':
      return phrases(text.quoteSentences, c);
    case 'punct-sentences':
      return phrases(text.punctuationSentences, c);
    case 'digit-rolls': {
      if (c.digits.length === 0) return [];
      const run = [...c.digits].sort();
      return fill(() => {
        const length = Math.min(run.length, 2 + Math.floor(c.random() * 3));
        const start = Math.floor(c.random() * (run.length - length + 1));
        const slice = run.slice(start, start + length);
        const roll = c.random() < 0.5 ? slice : slice.reverse();
        return length === 1 ? roll[0]!.repeat(2) : roll.join('');
      });
    }
    case 'counting': {
      const things = text.countables.filter(c.typeable);
      if (c.digits.length === 0 || things.length === 0) return [];
      return Array.from({ length: Math.ceil(c.count / 2) }, () => [plural(c), pick(things)]).flat();
    }
    case 'long-numbers':
      return c.digits.length === 0 ? [] : fill(() => number(c, 3, 5));
    case 'number-sentences': {
      if (c.digits.length === 0) return [];
      const filled = text.numberTemplates.map((t) => t.replace(/#/g, () => plural(c)));
      return phrases(filled, c);
    }
    case 'story': {
      if (c.passages.length === 0) return phrases(text.capitalSentences, c);
      // Short passages (like everyday phrases) get a second one so the practice isn't over in seconds.
      let left = [...c.passages];
      const words: string[] = [];
      while (words.length < 15 && left.length > 0) {
        const next = pick(left);
        left = left.filter((p) => p !== next);
        words.push(...splitText(next));
      }
      return words;
    }
    case 'long-story': {
      if (c.passages.length === 0) return phrases(text.capitalSentences, c);
      const first = pick(c.passages);
      const rest = c.passages.filter((p) => p !== first);
      return [...splitText(first), ...splitText(rest.length > 0 ? pick(rest) : first)];
    }
    case 'weak-keys': {
      const keys = c.weakKeys.length > 0 ? c.weakKeys.slice(0, 3) : c.focus;
      return c.words.length > 0 ? weakKeyDrill(c.words, keys, c.count, c.random) : [];
    }
    case 'symbol-words': {
      const symbols = c.focus.filter((k) => !/[a-z0-9]/.test(k));
      if (symbols.length === 0 || c.words.length === 0) return mixedWords(c);
      return fill(() => {
        const w = pick(c.words);
        if (c.random() < 0.4 || symbols.some((k) => w.includes(k))) return w;
        return c.random() < 0.5 ? pick(symbols) + w : w + pick(symbols);
      }).filter(c.typeable);
    }
  }
}

function echoBases(c: Ctx): string[] {
  switch (c.lesson.kind) {
    case 'punctuation': {
      const pool = unique([...text.contractions, ...punctuationPool]).filter(c.typeable);
      if (pool.length >= 4) return pool;
      break;
    }
    case 'numbers':
      if (c.digits.length > 0) return Array.from({ length: 12 }, () => number(c, 2, 3));
      break;
  }
  if (c.focusWords.length >= 4) return c.focusWords;
  if (c.words.length >= 4) return c.words;
  return letterGroups(c, 0.6);
}

function mixedWords(c: Ctx): string[] {
  if (c.words.length < 4) return letterGroups(c, 0.5);
  const lean = c.focusWords.length >= 4 && c.focusWords.length < c.words.length;
  // New punctuation keys (like , . or /) rarely appear in words, so they ride along at the end.
  const marks = c.lesson.kind === 'keys' ? c.focus.filter((k) => /[^a-z0-9]/i.test(k)) : [];
  return Array.from({ length: c.count }, () => {
    const pool = lean && c.random() < 0.4 ? c.focusWords : c.words;
    const word = pool[Math.floor(c.random() * pool.length)]!;
    return marks.length > 0 && c.random() < 0.3 ? word + marks[Math.floor(c.random() * marks.length)]! : word;
  });
}

function fallbackWords(c: Ctx): string[] {
  const words = mixedWords(c);
  if (words.length === 0) throw new Error(`Lesson ${c.lesson.id} has no drill text`);
  return words;
}

function letterGroups(c: Ctx, focusChance: number): string[] {
  const letters = c.allowed.filter((k) => !/[0-9]/.test(k));
  const usable = letters.length > 0 ? letters : c.allowed;
  if (usable.length === 0) throw new Error('A lesson drill needs at least one unlocked key');
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(c.random() * xs.length)]!;
  return Array.from({ length: c.count }, () => {
    const length = 2 + Math.floor(c.random() * 3);
    let group = '';
    for (let j = 0; j < length; j++) group += c.random() < focusChance ? pick(c.focus) : pick(usable);
    return group;
  });
}

/** Whole phrases or sentences, in random order, until there are enough words. */
function phrases(list: readonly string[], c: Ctx): string[] {
  const usable = list.filter(c.typeable);
  if (usable.length === 0) return [];
  const out: string[] = [];
  let last: string | undefined;
  while (out.length < c.count) {
    let next = usable[Math.floor(c.random() * usable.length)]!;
    if (next === last && usable.length > 1) next = usable[(usable.indexOf(next) + 1) % usable.length]!;
    out.push(...splitText(next));
    last = next;
  }
  return out;
}

function pickFrom(list: readonly string[], c: Ctx): string[] {
  const usable = list.filter(c.typeable);
  return usable.length >= 4 ? pickWords(usable, c.count, c.random) : [];
}

/** A number made only from the digits she knows, with no leading zero where possible. */
function number(c: Ctx, min: number, max: number): string {
  const length = min + Math.floor(c.random() * (max - min + 1));
  const pick = (xs: readonly string[]) => xs[Math.floor(c.random() * xs.length)]!;
  const lead = c.digits.filter((d) => d !== '0');
  let out = pick(lead.length > 0 ? lead : c.digits);
  while (out.length < length) out += pick(c.digits);
  return out;
}

function sentenceCase(p: string): string {
  const trimmed = p.trim();
  const ended = /[.?!']$/.test(trimmed) ? trimmed : `${trimmed}.`;
  return capitalise(ended);
}

/** A number that reads right before a plural word: never just 1. */
function plural(c: Ctx): string {
  for (let i = 0; i < 20; i++) {
    const n = number(c, 1, 2);
    if (n !== '1') return n;
  }
  return number(c, 2, 2);
}

function capitalise(w: string): string {
  return w[0]!.toUpperCase() + w.slice(1);
}

function unique(xs: readonly string[]): string[] {
  return [...new Set(xs)];
}

/**
 * Words that lean on the keys she misses most. `keys` is worst first: the worst key gets the
 * biggest share, and words holding a key more than once are picked more often.
 */
export function weakKeyDrill(words: readonly string[], keys: readonly string[], count: number, random: Random = Math.random): string[] {
  const base = unique(words);
  if (base.length === 0) throw new Error('No words to build a drill from');
  const pools = unique(keys.filter((k) => k.length === 1 && k !== ' '))
    .map((k) => drillWords(base, k))
    .filter((p) => p.length > 0);
  if (unique(pools.flat().map((w) => w.word)).length < 4) {
    return Array.from({ length: count }, () => base[Math.floor(random() * base.length)]!);
  }
  const keyWeights = pools.map((_, i) => pools.length - i);
  return Array.from({ length: count }, () => {
    const pool = pools[weightedIndex(keyWeights, random)]!;
    return pool[weightedIndex(pool.map((w) => w.hits), random)]!.word;
  });
}

type DrillWord = { word: string; hits: number };

function drillWords(base: readonly string[], key: string): DrillWord[] {
  const hits = (w: string, k: string) => [...w].filter((c) => c === k).length;
  const lower = key.toLowerCase();
  // Word pools are lowercase, so a missed capital is practised by capitalising words that start with it.
  if (key !== lower) {
    return base.filter((w) => w.startsWith(lower)).map((w) => ({ word: key + w.slice(1), hits: 1 }));
  }
  const containing = base.filter((w) => w.includes(key)).map((w) => ({ word: w, hits: hits(w, key) }));
  if (containing.length > 0 || /[a-z0-9]/.test(key)) return containing;
  // Few words hold symbols or punctuation, so those keys get tacked onto words instead.
  return base.slice(0, 12).map((w) => ({ word: w + key, hits: 1 }));
}

function weightedIndex(weights: readonly number[], random: Random): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r < 0) return i;
  }
  return weights.length - 1;
}
