import { describe, expect, it } from 'vitest';
import { drillFor, lessonPlan, planFor } from '../data/drills';
import { keysUpTo, lessonWordPool, lessons, punctuationPool, STEPS_PER_LESSON } from '../data/lessons';
import { commonWords } from '../data/words';
import { packs } from '../data/packs';
import { lessonDrill, weakKeyDrill } from './lessonWords';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const sources = { words: [...lessonWordPool, ...commonWords], passages: ['one two three'] };

const shiftFrom = lessons.find((l) => l.kind === 'shift')!.id;

function typeableAt(lessonId: number): Set<string> {
  const keys = keysUpTo(lessonId);
  const chars = new Set([' ', ...keys]);
  if (lessonId >= shiftFrom) for (const k of keys) if (/[a-z]/.test(k)) chars.add(k.toUpperCase());
  return chars;
}

describe('lessonDrill', () => {
  it('only uses keys she has learned, in every practice of every lesson', () => {
    for (const lesson of lessons) {
      const chars = typeableAt(lesson.id);
      for (let step = 1; step <= STEPS_PER_LESSON; step++) {
        for (const seed of [1, 2, 3]) {
          const drill = lessonDrill(lesson, step, { ...sources, passages: packs.flatMap((p) => p.passages), weakKeys: ['q', 'z', '7'] }, seeded(lesson.id * 100 + step * 10 + seed));
          expect(drill.length, `lesson ${lesson.id} step ${step}`).toBeGreaterThanOrEqual(15);
          for (const word of drill) {
            expect(word.length).toBeGreaterThan(0);
            for (const c of word) expect(chars.has(c), `${c} in "${word}", lesson ${lesson.id} step ${step}`).toBe(true);
          }
        }
      }
    }
  });

  it('starts with only f and j, one key at a time', () => {
    const drill = lessonDrill(lessons[0]!, 1, sources, seeded(3));
    expect(drill.every((w) => /^(f+|j+)$/.test(w))).toBe(true);
  });

  it('gives the vowel-free first lessons letter-group drills instead of word drills', () => {
    expect(planFor(lessons[0]!).some((d) => /words/.test(d.type))).toBe(false);
    expect(planFor(lessons.find((l) => l.id === 9)!)).toBe(lessonPlan('keys'));
  });

  it('keeps new punctuation keys in the word practices', () => {
    const lesson = lessons.find((l) => l.newKeys.includes(','))!;
    const checkpoint = lessonDrill(lesson, STEPS_PER_LESSON, sources, seeded(11)).join(' ');
    expect(checkpoint).toMatch(/[,.]/);
  });

  it('never counts just one of a plural thing', () => {
    const lesson = lessons.find((l) => l.kind === 'numbers')!;
    const step = lessonPlan('numbers').findIndex((d) => d.type === 'counting') + 1;
    for (const seed of [1, 2, 3, 4, 5]) expect(lessonDrill(lesson, step, sources, seeded(seed)).join(' ')).not.toMatch(/(^| )1 /);
  });

  it('rolls new keys against old ones in the second practice', () => {
    const lesson = lessons.find((l) => l.id === 2)!;
    const drill = lessonDrill(lesson, 2, sources, seeded(4));
    expect(drill.every((w) => /[dk]/.test(w) && /[fj]/.test(w))).toBe(true);
  });

  it('keeps tiny words tiny and makes the checkpoint longer', () => {
    const lesson = lessons.find((l) => l.id === 9)!;
    const tiny = lessonPlan('keys').findIndex((d) => d.type === 'tiny-words') + 1;
    expect(lessonDrill(lesson, tiny, sources, seeded(2)).every((w) => w.length <= 5)).toBe(true);
    expect(lessonDrill(lesson, STEPS_PER_LESSON, sources, seeded(2))).toHaveLength(25);
  });

  it('capitalises every word of a title', () => {
    const lesson = lessons.find((l) => l.kind === 'shift')!;
    const step = lessonPlan('shift').findIndex((d) => d.type === 'title-case') + 1;
    expect(lessonDrill(lesson, step, sources, seeded(3)).every((w) => /^[A-Z]/.test(w))).toBe(true);
  });

  it('says each word three times in the echo practice', () => {
    const lesson = lessons.find((l) => l.id === 9)!;
    const step = lessonPlan('keys').findIndex((d) => d.type === 'echo') + 1;
    const drill = lessonDrill(lesson, step, sources, seeded(5));
    for (let i = 0; i < drill.length; i += 3) expect(new Set(drill.slice(i, i + 3)).size).toBe(1);
  });

  it('moves from letter groups to real words over the lesson', () => {
    const lesson = lessons.find((l) => l.id === 9)!;
    const isWord = (w: string) => sources.words.includes(w);
    const step1 = lessonDrill(lesson, 1, sources, seeded(1)).filter(isWord).length;
    const step8 = lessonDrill(lesson, 8, sources, seeded(1)).filter(isWord).length;
    expect(step8).toBeGreaterThan(step1);
  });

  it('uses the left Shift for right-hand capitals and the other way round', () => {
    const lesson = lessons.find((l) => l.kind === 'shift')!;
    expect(lessonDrill(lesson, 1, sources, seeded(2)).every((w) => /^[YUIOPHJKLNM]/.test(w))).toBe(true);
    expect(lessonDrill(lesson, 2, sources, seeded(2)).every((w) => /^[QWERTASDFGZXCVB]/.test(w))).toBe(true);
  });

  it('keeps quotes and questions out of the first Shift lessons and adds them in punctuation', () => {
    const shift = lessons.find((l) => l.kind === 'shift')!;
    const plain = lessonPlan('shift').flatMap((_, i) => lessonDrill(shift, i + 1, sources, seeded(i))).join(' ');
    expect(plain).not.toMatch(/['?]/);
    const punctuation = lessons.find((l) => l.kind === 'punctuation')!;
    expect(lessonDrill(punctuation, 1, sources, seeded(2)).some((w) => w.includes("'"))).toBe(true);
    expect(lessonDrill(punctuation, 2, sources, seeded(2)).some((w) => w.endsWith('?'))).toBe(true);
    expect(lessonDrill(punctuation, 8, sources, seeded(2)).some((w) => punctuationPool.includes(w) || /['?]/.test(w))).toBe(true);
  });

  it('builds numbers only from the digits taught so far', () => {
    const lesson = lessons.find((l) => l.id === 17)!;
    for (let step = 1; step <= STEPS_PER_LESSON; step++) {
      const drill = lessonDrill(lesson, step, sources, seeded(step));
      expect(drill.join(' ')).not.toMatch(/[6-90]/);
    }
    expect(lessonDrill(lesson, 1, sources, seeded(5)).every((w) => /^[1-5]+$/.test(w))).toBe(true);
    const counting = lessonDrill(lesson, 2, sources, seeded(5));
    expect(counting.filter((_, i) => i % 2 === 0).every((w) => /^[1-5]+$/.test(w))).toBe(true);
  });

  it('uses a passage for story practices and two for the long one', () => {
    const lesson = { ...lessons.find((l) => l.kind === 'sentences')!, passages: [] };
    const story = lessonPlan('sentences').findIndex((d) => d.type === 'story') + 1;
    // Shared passages are lowercase; by the sentence lessons they get a capital and a full stop.
    expect(lessonDrill(lesson, story, { ...sources, passages: ['one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen'] })).toHaveLength(15);
    expect(lessonDrill(lesson, story, { ...sources, passages: ['one two three'] }).slice(0, 3)).toEqual(['One', 'two', 'three.']);
    expect(lessonDrill(lesson, 8, { ...sources, passages: ['one two', 'three four five'] }, seeded(1))).toHaveLength(5);
  });

  it('drills the keys she misses most in the tricky keys practice', () => {
    const lesson = lessons.find((l) => l.kind === 'sentences')!;
    const step = lessonPlan('sentences').findIndex((d) => d.type === 'weak-keys') + 1;
    const drill = lessonDrill(lesson, step, { ...sources, weakKeys: ['z'] }, seeded(6));
    expect(drill.every((w) => w.includes('z'))).toBe(true);
    // Once shift is learned, a missed capital is drilled as capitalised words.
    expect(lessonDrill(lesson, step, { ...sources, weakKeys: ['Q'] }, seeded(6)).every((w) => w.startsWith('Q'))).toBe(true);
  });

  it("prefers a lesson's own words and passages", () => {
    const base = lessons.find((l) => l.id === 12)!;
    const own = { ...base, words: ['bean', 'been', 'blue', 'bank', 'bun', 'nab', 'ban', 'nib'], passages: ['a blue bean'] };
    const words = lessonDrill(own, lessonPlan('keys').findIndex((d) => d.seconds) + 1, sources, seeded(7));
    expect(words.every((w) => own.words.includes(w))).toBe(true);
  });

  it('drills letter patterns as chunks', () => {
    const base = lessons.find((l) => l.id === 12)!;
    const patterns = { ...base, kind: 'patterns', focus: ['th', 'ing'] } as unknown as typeof base;
    const drill = lessonDrill(patterns, 1, sources, seeded(8));
    expect(drill.every((w) => w.includes('th') || w.includes('ing'))).toBe(true);
  });
});

describe('lesson plans', () => {
  const kinds = [...new Set(lessons.map((l) => l.kind)), 'patterns', 'symbols', 'speed', 'reading'] as const;

  it('gives every lesson kind eight different practices', () => {
    for (const kind of kinds) {
      const plan = lessonPlan(kind);
      expect(plan, kind).toHaveLength(STEPS_PER_LESSON);
      expect(new Set(plan.map((d) => d.title)).size, kind).toBe(STEPS_PER_LESSON);
      const shapes = plan.map((d) => `${d.type}|${d.seconds}|${d.noBackspace}|${d.stopOnError}|${d.hideKeyboard}`);
      expect(new Set(shapes).size, kind).toBe(STEPS_PER_LESSON);
    }
  });

  it('includes a sprint, an eyes-up run and a strict checkpoint in every lesson', () => {
    for (const kind of kinds) {
      const plan = lessonPlan(kind);
      expect(plan.some((d) => d.seconds), kind).toBe(true);
      // Even good typists glance at the number row, so number lessons keep the keyboard.
      if (kind !== 'numbers') expect(plan.some((d) => d.hideKeyboard), kind).toBe(true);
      expect(plan.at(-1)?.noBackspace, kind).toBe(true);
    }
  });

  it('builds all eight practices for the kinds still to come, from their own content', () => {
    const base = lessons.at(-1)!;
    const extra = {
      words: ['then', 'there', 'thing', 'ring', 'sing', 'other', 'mother', 'think'],
      passages: ['the thing about this is that nothing is the same, and that is the best thing of all'],
      focus: ['th', 'ing'],
    };
    for (const kind of ['patterns', 'symbols', 'speed', 'reading']) {
      const lesson = { ...base, ...extra, kind, newKeys: kind === 'symbols' ? ['?', "'"] : [] } as unknown as typeof base;
      const chars = typeableAt(base.id);
      for (let step = 1; step <= STEPS_PER_LESSON; step++) {
        const drill = lessonDrill(lesson, step, sources, seeded(step));
        expect(drill.length, `${kind} step ${step}`).toBeGreaterThanOrEqual(15);
        for (const c of drill.join(' ')) expect(chars.has(c), `${c} in ${kind} step ${step}`).toBe(true);
      }
    }
  });

  it('rejects a step outside the lesson', () => {
    expect(() => drillFor(lessons[0]!, 0)).toThrow();
    expect(() => drillFor(lessons[0]!, STEPS_PER_LESSON + 1)).toThrow();
  });
});

describe('weakKeyDrill', () => {
  it('prefers words containing the missed keys', () => {
    const drill = weakKeyDrill(['apple', 'zoo', 'pear', 'plum', 'pip', 'kiwi'], ['p'], 10, seeded(4));
    expect(drill.every((w) => w.includes('p'))).toBe(true);
  });

  it('gives the worst key the biggest share', () => {
    const words = ['ra', 'rb', 'rc', 'rd', 'ta', 'tb', 'tc', 'td'];
    const drill = weakKeyDrill(words, ['r', 't'], 600, seeded(11));
    const r = drill.filter((w) => w.startsWith('r')).length;
    // Weights are 2:1, so about 400 of 600.
    expect(r).toBeGreaterThan(340);
    expect(r).toBeLessThan(460);
  });

  it('picks words holding the key more often', () => {
    const drill = weakKeyDrill(['pop', 'pip', 'pup', 'apple', 'pa', 'pe', 'po', 'pu'], ['p'], 800, seeded(12));
    const count = (w: string) => drill.filter((d) => d === w).length;
    expect(count('pop')).toBeGreaterThan(count('pa') * 1.4);
  });

  it('drills a missed capital with capitalised words', () => {
    const drill = weakKeyDrill(['rice', 'ramen', 'rose', 'run', 'tea', 'cake'], ['R'], 20, seeded(13));
    expect(drill.every((w) => w.startsWith('R'))).toBe(true);
  });

  it('falls back to any word when too few match', () => {
    expect(weakKeyDrill(['a', 'b'], ['q'], 3, () => 0)).toEqual(['a', 'a', 'a']);
  });
});

describe('the advanced lessons', () => {
  it('build every practice from their own content', () => {
    for (const lesson of lessons.filter((l) => ['patterns', 'symbols', 'speed', 'reading'].includes(l.kind))) {
      for (let step = 1; step <= STEPS_PER_LESSON; step++) {
        const drill = lessonDrill(lesson, step, sources, seeded(step));
        if (lesson.words && /words|chunks|echo/.test(drillFor(lesson, step).type)) {
          expect(drill.some((w) => lesson.words!.includes(w) || lesson.focus?.includes(w)), `lesson ${lesson.id} step ${step}`).toBe(true);
        }
      }
    }
  });

  it('joins two different passages in the reading checkpoint', () => {
    const lesson = lessons.find((l) => l.kind === 'reading' && (l.passages?.length ?? 0) > 1)!;
    for (let seed = 0; seed < 10; seed++) {
      const text = lessonDrill(lesson, STEPS_PER_LESSON, sources, seeded(seed)).join(' ');
      expect(lesson.passages!.filter((p) => text.includes(p)), `seed ${seed}`).toHaveLength(2);
    }
  });
});

describe('weakKeyDrill with punctuation', () => {
  it('adds a missed punctuation key onto words', () => {
    const drill = weakKeyDrill(['tea', 'rice', 'soup', 'naan', 'cake'], ['?'], 10, seeded(9));
    expect(drill.every((w) => w.endsWith('?'))).toBe(true);
  });
});
