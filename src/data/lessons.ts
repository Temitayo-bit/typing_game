import {
  cdramaSaga,
  datesTimesPrices,
  everydayPhrases,
  familyChaos,
  finalStretch,
  grandFinale,
  kdramaStory,
  realSentences,
  recipesAndPlans,
  textsAndChats,
  workMessages,
} from './lessonPassages';
import { alternatingWords, next50, patternWords, symbolWords, themedVocab, top50 } from './lessonVocab';

/** Kinds for lessons after every key is learned; they bring their own words or passages. */
export const ADVANCED_KINDS = ['patterns', 'symbols', 'speed', 'reading'] as const;
export type AdvancedKind = (typeof ADVANCED_KINDS)[number];
export type LessonKind = 'keys' | 'shift' | 'punctuation' | 'numbers' | 'sentences' | AdvancedKind;

export type Lesson = {
  id: number;
  level: number;
  title: string;
  kind: LessonKind;
  newKeys: string[];
  tip: string;
  /** Lesson-specific real words. Every one is typeable with the keys taught so far. */
  words?: readonly string[];
  /** Lesson-specific passages, used instead of the general text packs. */
  passages?: readonly string[];
  /** Letter groups a 'patterns' lesson drills as chunks, such as 'th' or 'ing'. */
  focus?: readonly string[];
};

export const levels = [
  { id: 1, title: 'Home row' },
  { id: 2, title: 'Top row' },
  { id: 3, title: 'Bottom row' },
  { id: 4, title: 'Capitals and punctuation' },
  { id: 5, title: 'Numbers and real text' },
  { id: 6, title: 'Letter pairs and endings' },
  { id: 7, title: 'Symbols' },
  { id: 8, title: 'Speed building' },
  { id: 9, title: 'Real-life typing' },
  { id: 10, title: 'Long passages' },
];

/**
 * Classic touch-typing order: home row outwards, then the rows above and below,
 * then capitals, punctuation and numbers. After that the course follows what
 * good typing courses do once every key is known: chunk common letter pairs,
 * add symbols, build speed on the most common words, then real-world text and
 * longer passages. Ids are stable because saved progress refers to them.
 */
const baseLessons: Lesson[] = [
  { id: 1, level: 1, title: 'Find your spot: F and J', kind: 'keys', newKeys: ['f', 'j'], tip: 'Rest your index fingers on F and J. Feel the little bumps? That is home. Keep your eyes on the screen, not your hands.' },
  { id: 2, level: 1, title: 'Middle fingers: D and K', kind: 'keys', newKeys: ['d', 'k'], tip: 'Your middle fingers sit next to your index fingers, on D and K. Tap lightly; a soft touch is a fast touch.' },
  { id: 3, level: 1, title: 'Ring and little fingers', kind: 'keys', newKeys: ['s', 'l', 'a', ';'], tip: 'Ring fingers on S and L, little fingers on A and ;. All eight fingers are home now. Thumbs share the space bar.' },
  { id: 4, level: 1, title: 'Reach in: G and H', kind: 'keys', newKeys: ['g', 'h'], tip: 'Slide your index fingers one key inwards for G and H, then come straight back. Coming home is half the skill.' },
  { id: 5, level: 2, title: 'Reach up: E and I', kind: 'keys', newKeys: ['e', 'i'], tip: 'Left middle finger reaches up for E, right middle finger for I. Only that finger moves; the rest stay home.' },
  { id: 6, level: 2, title: 'Reach up: R and U', kind: 'keys', newKeys: ['r', 'u'], tip: 'Index fingers reach up and slightly left for R and U. Now you can type sushi, sugar and dear.' },
  { id: 7, level: 2, title: 'Reach up: T, Y, W and O', kind: 'keys', newKeys: ['t', 'y', 'w', 'o'], tip: 'Index fingers stretch up and in for T and Y; ring fingers reach up for W and O. Slow and right beats fast and wrong.' },
  { id: 8, level: 2, title: 'Reach up: Q and P', kind: 'keys', newKeys: ['q', 'p'], tip: 'Little fingers reach up for Q and P. Keep the other fingers anchored on the home row.' },
  { id: 9, level: 3, title: 'Reach down: N and M', kind: 'keys', newKeys: ['n', 'm'], tip: 'Right index finger curls down for N and M. And, in, on, miso and mango are all yours now.' },
  { id: 10, level: 3, title: 'Reach down: C, X, comma, full stop', kind: 'keys', newKeys: ['c', 'x', ',', '.'], tip: 'Middle fingers curl down for C and comma, ring fingers for X and full stop. Keep your wrists floating, not resting.' },
  { id: 11, level: 3, title: 'Reach down: Z and slash', kind: 'keys', newKeys: ['z', '/'], tip: 'Little fingers curl down for Z and /. These are the rarest keys, so take them slowly.' },
  { id: 12, level: 3, title: 'Last letters: V and B', kind: 'keys', newKeys: ['v', 'b'], tip: 'Left index curls down for V, then down and in for B. Love and baby are yours, and that is every letter!' },
  { id: 13, level: 4, title: 'Capitals with Shift', kind: 'shift', newKeys: [], tip: 'Hold Shift with the little finger of the other hand, then press the letter. Left-hand letter, right Shift, and the other way round.' },
  { id: 14, level: 4, title: 'Names and places', kind: 'shift', newKeys: [], tip: 'More capitals. Let go of Shift as soon as the letter is down, or you will get two capitals.' },
  { id: 15, level: 4, title: "Quotes and questions: ' and ?", kind: 'punctuation', newKeys: ["'", '?'], tip: "Right little finger: ' is next to ;, and ? is left Shift + /." },
  { id: 16, level: 4, title: 'Punctuation practice', kind: 'punctuation', newKeys: [], tip: 'Commas, full stops, quotes and questions all together. One space after a full stop is plenty.' },
  { id: 17, level: 5, title: 'Numbers 1 to 5', kind: 'numbers', newKeys: ['1', '2', '3', '4', '5'], tip: 'Left hand reaches up two rows: little finger 1, ring 2, middle 3, index 4 and 5. Reach, tap, return home.' },
  { id: 18, level: 5, title: 'Numbers 6 to 0', kind: 'numbers', newKeys: ['6', '7', '8', '9', '0'], tip: 'Right hand: index 6 and 7, middle 8, ring 9, little finger 0.' },
  { id: 19, level: 5, title: 'Real sentences', kind: 'sentences', newKeys: [], tip: 'Full sentences about things you love, with capitals and punctuation. Steady and accurate.', passages: realSentences },
  { id: 20, level: 5, title: 'The final stretch', kind: 'sentences', newKeys: [], tip: 'Longer passages. Finish this and every letter, number and basic punctuation key is yours. Symbols and speed come next.', passages: finalStretch },

  { id: 21, level: 6, title: 'Pairs: th and he', kind: 'patterns', newKeys: [], focus: ['th', 'he', 'the'], words: patternWords.th, tip: 'TH and HE are the most common letter pairs in English. Type them as one quick roll, not two separate taps.' },
  { id: 22, level: 6, title: 'Pairs: in, an, er and re', kind: 'patterns', newKeys: [], focus: ['in', 'an', 'er', 're'], words: patternWords.inAnErRe, tip: 'Fast typists think in chunks, not letters. Let your fingers learn these pairs as single moves.' },
  { id: 23, level: 6, title: 'Endings: ing, ed and ly', kind: 'patterns', newKeys: [], focus: ['ing', 'ed', 'ly'], words: patternWords.endings, tip: 'Word endings repeat all day long. Once -ing is automatic, half your verbs type themselves.' },
  { id: 24, level: 6, title: 'Clusters: ou, ea, st and ch', kind: 'patterns', newKeys: [], focus: ['ou', 'ea', 'st', 'ch'], words: patternWords.clusters, tip: 'Some pairs use the same hand twice, which feels awkward at first. Keep it smooth rather than fast.' },

  { id: 25, level: 7, title: 'Excited: ! : ( and )', kind: 'symbols', newKeys: ['!', ':', '(', ')'], words: symbolWords.smile, tip: 'Hold Shift for each: ! is Shift + 1, : is Shift + ;, ( and ) are Shift + 9 and 0. Smileys included.' },
  { id: 26, level: 7, title: 'Tags and emails: @ # - and _', kind: 'symbols', newKeys: ['@', '#', '-', '_'], words: symbolWords.tags, tip: '@ is Shift + 2 and # is Shift + 3. The - key sits right of 0; add Shift for _. Right little finger does both.' },
  { id: 27, level: 7, title: 'Money and maths: $ % & * + =', kind: 'symbols', newKeys: ['$', '%', '&', '*', '+', '='], words: symbolWords.money, tip: '$ % are Shift + 4 and 5 (left index), & * are Shift + 7 and 8. = is right of -, and + is Shift + =.' },
  { id: 28, level: 7, title: 'Quotes and brackets: " [ ] < >', kind: 'symbols', newKeys: ['"', '[', ']', '<', '>'], words: symbolWords.brackets, tip: '" is Shift + \', [ and ] sit right of P. < and > are Shift + comma and full stop. Yes, <3 counts.' },

  { id: 29, level: 8, title: 'The 50 most common words', kind: 'speed', newKeys: [], words: top50, tip: 'These 50 words make up a huge share of everything you type. Aim for even, steady keystrokes, like a metronome.' },
  { id: 30, level: 8, title: 'The next 50 words', kind: 'speed', newKeys: [], words: next50, tip: 'Read one word ahead while you type the current one. Your eyes lead, your fingers follow.' },
  { id: 31, level: 8, title: 'Hand-to-hand rhythm', kind: 'speed', newKeys: [], words: alternatingWords, tip: 'Every word here swaps hands on each letter. One hand gets ready while the other types, so these flow fast.' },
  { id: 32, level: 8, title: 'Everyday phrases', kind: 'reading', newKeys: [], passages: everydayPhrases, tip: 'Common phrases, no punctuation. Try typing each phrase as one smooth burst before you pause.' },

  { id: 33, level: 9, title: 'Texts and chats', kind: 'reading', newKeys: [], passages: textsAndChats, tip: 'The way you really type to friends: lowercase, exclamation marks and the odd smiley.' },
  { id: 34, level: 9, title: 'Work messages', kind: 'reading', newKeys: [], passages: workMessages, tip: 'Polished messages for work. Capitals, colons and apostrophes, all without looking down.' },
  { id: 35, level: 9, title: 'Dates, times and prices', kind: 'reading', newKeys: [], passages: datesTimesPrices, tip: 'Numbers mixed with words are the trickiest real text. Go slowly; accuracy matters more than speed here.' },
  { id: 36, level: 9, title: 'Recipes and plans', kind: 'reading', newKeys: [], passages: recipesAndPlans, tip: 'Lists with commas, numbers and the odd bracket. Your little fingers will be busy.' },

  { id: 37, level: 10, title: 'Rooftop confessions', kind: 'reading', newKeys: [], passages: kdramaStory, tip: 'Long passages now. Find a rhythm you can keep for the whole story instead of sprinting the first line.' },
  { id: 38, level: 10, title: 'Under the plum blossoms', kind: 'reading', newKeys: [], passages: cdramaSaga, tip: 'If you make a mistake, fix it calmly and keep going. Panic costs more time than the typo.' },
  { id: 39, level: 10, title: 'Family dinner chaos', kind: 'reading', newKeys: [], passages: familyChaos, tip: 'Relax your shoulders and hands. Tension slows you down more than anything else.' },
  { id: 40, level: 10, title: 'The grand finale', kind: 'reading', newKeys: [], passages: grandFinale, tip: 'The last lesson. Finish this and you are a real touch typist.' },
];

const MIN_THEMED_WORDS = 4;

/** Letter lessons also get themed real words she can already type. */
export const lessons: Lesson[] = baseLessons.map((l) => (l.kind === 'keys' ? withThemedWords(l) : l));

function withThemedWords(lesson: Lesson): Lesson {
  const keys = keysThrough(baseLessons, lesson.id);
  const typeable = themedVocab.filter((w) => [...w].every((c) => keys.has(c)));
  const fresh = typeable.filter((w) => lesson.newKeys.some((k) => w.includes(k)));
  const words = fresh.length >= MIN_THEMED_WORDS ? fresh : typeable;
  return words.length >= MIN_THEMED_WORDS ? { ...lesson, words: [...new Set(words)] } : lesson;
}

export const STEPS_PER_LESSON = 8;
export const STEP_WORDS = 20;
export const PASS_ACCURACY = 90;

export function keysUpTo(lessonId: number): Set<string> {
  return keysThrough(lessons, lessonId);
}

function keysThrough(list: readonly Lesson[], lessonId: number): Set<string> {
  return new Set(list.filter((l) => l.id <= lessonId).flatMap((l) => l.newKeys));
}

export function findLesson(id: number): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

/** Extra beginner-friendly words so early lessons still use real words. */
export const lessonWordPool = `a as ad add all ask asks fad fall falls flask lad lads lass sad salad dad dads ja la sala alfalfa
gas glad flag hall half has had dash hash shall flash slash lash sash
see sea seed feel feed fee field fill kid kids lid side slide ideal deal deals idle hike like likes
red read rid ride rule sure dues fur fuel hurt use user rude sugar real fire dear jade lure
the tie tea that this they yet try type tree art eat hat sit sky style dirty kitty truly
we wet wow owl low slow word work world worth two too foot food root roof yellow follow
quiet quite equal paper people pop top tip trip spot spirit happy quote quietly
move movie view very ever even mom me my time more simply value five love lovely
cat cake cool could cozy cute catch call ice nice coffee
fix six box text extra taxi relax
zoo lazy zero crazy fizz quiz
nab bun bean been blue book brown be bad bed bank banana fun sun run nan man`.split(/\s+/);

/** Short contractions and questions for the punctuation lesson. */
export const punctuationPool = [
  "don't", "it's", "you're", "i'm", "we're", "can't", "that's", "let's", "she's", "isn't",
  'ready?', 'why?', 'really?', 'how?', 'what?', 'tonight?', 'coffee?', 'sushi?', 'now?', 'yes?',
];
