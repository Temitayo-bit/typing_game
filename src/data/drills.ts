import type { Rules } from '../game/engine';
import { STEPS_PER_LESSON, type Lesson, type LessonKind } from './lessons';

/** The kind of exercise a practice uses. Each one is built by its own generator in lessonWords.ts. */
export type DrillType =
  | 'meet' // one new key at a time, repeated
  | 'chunks' // letter patterns like th or ing, alone and inside words
  | 'pairs' // new keys rolled against keys she already knows
  | 'shuffle' // random letter groups from every learned key
  | 'tiny-words' // short real words that use the new keys
  | 'echo' // each word three times in a row
  | 'lesson-words' // the lesson's own word list, or learned words
  | 'mixed-words' // any learned words
  | 'left-caps' // capitals typed with the left Shift
  | 'right-caps' // capitals typed with the right Shift
  | 'big-small' // the same word lowercase then capitalised
  | 'names' // names, places and foods
  | 'title-case' // Every Word Capitalised
  | 'cap-sentences'
  | 'contractions'
  | 'questions'
  | 'commas'
  | 'quotes'
  | 'punct-sentences'
  | 'digit-rolls'
  | 'counting' // number then word: 3 dumplings
  | 'long-numbers'
  | 'number-sentences'
  | 'short-sentences'
  | 'story' // a themed passage
  | 'weak-keys' // words full of the keys she misses most
  | 'long-story' // two passages back to back
  | 'symbol-words'; // the lesson's new symbols mixed into words

export type Drill = Rules & {
  type: DrillType;
  title: string;
  blurb: string;
  /** Runs against the clock instead of to the end of the text. */
  seconds?: number;
  /** Hides the on-screen keyboard so she stops looking down. */
  hideKeyboard?: boolean;
};

const d = (type: DrillType, title: string, blurb: string, extra: Partial<Drill> = {}): Drill => ({ type, title, blurb, ...extra });

const lookAway = (type: DrillType): Drill =>
  d(type, 'Eyes up', 'No keyboard picture this time. Trust your fingers and keep your eyes on the words.', { hideKeyboard: true });
const sprint = (type: DrillType, seconds = 30): Drill =>
  d(type, `${seconds}-second sprint`, 'Type as many as you can before the clock runs out. Stay accurate, the clock is just for fun.', { seconds });
const perfect = (type: DrillType, title: string, blurb: string): Drill =>
  d(type, title, `${blurb} The cursor waits until you press the right key.`, { stopOnError: true });
const checkpoint = (type: DrillType, blurb: string): Drill =>
  d(type, 'Checkpoint', `${blurb} Backspace is off, so if you slip, just keep going.`, { noBackspace: true });

/**
 * Eight different exercises per lesson, ordered the way good trainers do it:
 * meet the keys, drill them, put them in words, take the keyboard away, a timed run, then a checkpoint.
 */
/** Kinds planned ahead for the lessons being added alongside this change. */
type PlanKind = LessonKind | 'patterns' | 'symbols' | 'speed' | 'reading';

const plans: Record<PlanKind, readonly Drill[]> = {
  keys: [
    d('meet', 'Meet the new keys', 'Each new key a few times on its own. Say the letter in your head as you press it.'),
    d('pairs', 'Back and forth', 'New keys rolled against the ones you already know. Your fingers jump out and come straight home.'),
    d('shuffle', 'Shuffle', 'Every key you know, mixed up at random. No patterns to lean on.'),
    perfect('tiny-words', 'Tiny words', 'Little words that use the new keys.'),
    d('echo', 'Say it three times', 'Each word three times in a row. The second and third go faster, that is muscle memory forming.'),
    lookAway('mixed-words'),
    sprint('mixed-words'),
    checkpoint('mixed-words', 'A longer run with everything from this lesson.'),
  ],
  shift: [
    d('left-caps', 'Left Shift, right hand', 'Hold the left Shift with your left little finger and type a right-hand capital.'),
    d('right-caps', 'Right Shift, left hand', 'Now the other way round: right little finger on Shift, left hand types the letter.'),
    d('big-small', 'Big and small', 'Each word twice, once small and once with a capital. Let go of Shift straight away.'),
    perfect('names', 'Names and places', 'Cities, foods and names, all starting with a capital.'),
    d('title-case', 'Title Case', 'Every Word Starts With A Capital, like a drama title.'),
    lookAway('names'),
    sprint('names'),
    checkpoint('cap-sentences', 'Real sentences with capitals and full stops.'),
  ],
  punctuation: [
    d('contractions', 'Apostrophes', "Little words like don't and it's. The apostrophe is right next to ;."),
    d('questions', 'Questions', 'Questions end with Shift and /. Your right little finger does both.'),
    d('commas', 'Commas and full stops', 'Short lists and stops. Comma and full stop sit right under K and L.'),
    perfect('quotes', 'Quotes', "Somebody said something. Wrap it in quote marks, like 'this'."),
    d('echo', 'Say it three times', 'Each bit of punctuation three times in a row.'),
    lookAway('punct-sentences'),
    sprint('contractions'),
    checkpoint('punct-sentences', 'Sentences full of commas, quotes and questions.'),
  ],
  numbers: [
    d('digit-rolls', 'Number rolls', 'The new numbers on their own, rolled up and down the row.'),
    d('counting', 'Counting', 'A number then a word, like ordering at a restaurant.'),
    perfect('long-numbers', 'Long numbers', 'Bigger numbers. Keep the reach steady and come back to the home row.'),
    d('echo', 'Say it three times', 'Each number three times in a row.'),
    d('number-sentences', 'Numbers in sentences', 'Little stories with numbers in them.'),
    lookAway('counting'),
    sprint('counting'),
    checkpoint('number-sentences', 'Sentences with numbers, words and punctuation.'),
  ],
  sentences: [
    d('short-sentences', 'Short and sweet', 'Short sentences with capitals and full stops.'),
    d('story', 'Story time', 'A little story about something you love.'),
    perfect('punct-sentences', 'Punctuation party', 'Sentences full of commas, quotes and questions.'),
    d('number-sentences', 'Numbers in the wild', 'Sentences with numbers mixed in.'),
    d('weak-keys', 'Tricky keys', 'Words packed with the keys you have missed the most.'),
    lookAway('story'),
    sprint('short-sentences', 60),
    checkpoint('long-story', 'A long passage, start to finish.'),
  ],
  patterns: [
    d('chunks', 'Meet the patterns', 'Each letter pattern on its own, then inside words. Type it as one smooth roll.'),
    d('lesson-words', 'Pattern words', 'Words built around the patterns in this lesson.'),
    perfect('tiny-words', 'Perfect patterns', 'Short words with the patterns, slow and exact.'),
    d('echo', 'Say it three times', 'Each word three times. Feel the pattern roll off your fingers.'),
    d('story', 'Story time', 'The patterns inside a real little story.'),
    lookAway('lesson-words'),
    sprint('lesson-words'),
    checkpoint('long-story', 'A longer passage to finish the lesson.'),
  ],
  symbols: [
    d('meet', 'Meet the new symbols', 'Each new symbol on its own a few times. Most need Shift, so use the other hand for it.'),
    d('pairs', 'Back and forth', 'Symbols rolled against letters you already know.'),
    d('symbol-words', 'Symbols in words', 'The new symbols mixed in with real words.'),
    d('echo', 'Say it three times', 'Each one three times in a row.'),
    perfect('symbol-words', 'Perfect symbols', 'Slow and exact.'),
    lookAway('symbol-words'),
    sprint('symbol-words'),
    checkpoint('story', 'Real text with the symbols in it.'),
  ],
  speed: [
    sprint('lesson-words', 15),
    d('echo', 'Say it three times', 'Repeats get fast. Push the speed on the second and third go.'),
    sprint('lesson-words', 30),
    d('weak-keys', 'Tricky keys', 'Speed comes from fixing the slow keys. Here are yours.'),
    d('story', 'Story time', 'A smooth, even pace through a whole passage.'),
    lookAway('lesson-words'),
    sprint('short-sentences', 60),
    checkpoint('long-story', 'A long run. Stay smooth rather than rushing.'),
  ],
  reading: [
    d('story', 'Story time', 'A passage to settle in.'),
    d('short-sentences', 'Short and sweet', 'Short sentences with capitals and full stops.'),
    perfect('story', 'Perfect passage', 'Slow down and get every key right.'),
    d('punct-sentences', 'Punctuation party', 'Sentences full of commas, quotes and questions.'),
    d('weak-keys', 'Tricky keys', 'Words packed with the keys you have missed the most.'),
    lookAway('story'),
    sprint('story', 60),
    checkpoint('long-story', 'A long passage, start to finish.'),
  ],
};

export function lessonPlan(kind: PlanKind): readonly Drill[] {
  return plans[kind];
}

export function drillFor(lesson: Pick<Lesson, 'kind'>, step: number): Drill {
  const plan = lessonPlan(lesson.kind);
  const drill = plan[step - 1];
  if (!drill) throw new Error(`Lesson step ${step} is outside 1 to ${STEPS_PER_LESSON}`);
  return drill;
}
