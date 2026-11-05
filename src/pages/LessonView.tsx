import { useCallback, useState } from 'react';
import { drillFor, type Drill } from '../data/drills';
import { findLesson, keysUpTo, lessons, PASS_ACCURACY, STEPS_PER_LESSON } from '../data/lessons';
import type { Result } from '../game/stats';
import type { SavedResult } from '../lib/history';
import { lessonKey, type ModeKey } from '../lib/modes';
import { examOpen, isUnlocked, MIN_PASS_CHARS, nextStep, passedExam, passedStep, passedStepsOf, type StepRef } from '../lib/progress';
import { lessonsInLevel } from '../data/exams';
import type { Route } from '../lib/route';
import { Card } from '../components/ui';
import { Practice } from './Practice';

type Props = {
  lessonId: number;
  results: SavedResult[];
  unlocked: StepRef;
  go: (r: Route) => void;
  onFinish: (key: ModeKey, r: Result, textKeys?: string[]) => void;
};

export function LessonView({ lessonId, results, unlocked, go, onFinish }: Props) {
  const lesson = findLesson(lessonId);
  const passed = passedStepsOf(results, lessonId);
  const firstOpen = Array.from({ length: STEPS_PER_LESSON }, (_, i) => i + 1).find(
    (s) => !passed.has(s) && isUnlocked({ lessonId, step: s }, unlocked),
  );
  const [chosen, setChosen] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const step = chosen ?? firstOpen ?? 1;

  const endsLevel = lesson !== undefined && lesson.id === lessonsInLevel(lesson.level).at(-1)?.id && step === STEPS_PER_LESSON;
  const examLevel = endsLevel && !passedExam(results, lesson.level) ? lesson.level : null;
  const goNext = () => {
    if (examLevel !== null) return go({ page: 'exam', level: examLevel });
    const next = nextStep({ lessonId, step });
    if (!next) return;
    if (next.lessonId === lessonId) setChosen(next.step);
    else go({ page: 'lesson', lessonId: next.lessonId });
  };

  // Pin the step so unlocking the next one doesn't swap out the result screen.
  const finish = useCallback(
    (key: ModeKey, r: Result, textKeys?: string[]) => {
      setChosen(step);
      onFinish(key, r, textKeys);
    },
    [step, onFinish, setChosen],
  );

  if (!lesson || !isUnlocked({ lessonId, step: 1 }, unlocked)) {
    const waitingOn = lesson && lesson.level > 1 && !passedExam(results, lesson.level - 1) && examOpen(results, lesson.level - 1) ? lesson.level - 1 : null;
    return (
      <Card className="text-center">
        <p className="text-lg">
          {waitingOn ? `This lesson opens once you pass the level ${waitingOn} exam.` : 'This lesson is still locked. Finish the one before it first.'}
        </p>
        {waitingOn && (
          <button className="mt-4 mr-6 font-bold text-berry" onClick={() => go({ page: 'exam', level: waitingOn })}>
            Take the level {waitingOn} exam
          </button>
        )}
        <button className="mt-4 font-bold text-berry" onClick={() => go({ page: 'lessons' })}>
          Back to all lessons
        </button>
      </Card>
    );
  }

  const isLast = lesson.id === lessons.at(-1)?.id && step === STEPS_PER_LESSON;
  const drill = drillFor(lesson, step);
  return (
    <div className="flex flex-col gap-5">
      <button className="self-start font-bold text-berry hover:text-wine" onClick={() => go({ page: 'lessons' })}>
        ← All lessons
      </button>
      <Card className="flex flex-col gap-5 sm:p-8">
        <div className="text-sm font-bold tracking-[0.08em] text-berry uppercase">
          Lesson {lesson.id} · practice {step} of {STEPS_PER_LESSON}
        </div>
        <h1 className="m-0 font-display text-[30px] font-semibold">{lesson.title}</h1>
        <p className="m-0 leading-normal text-muted">{lesson.tip}</p>
        <div className="flex flex-col gap-2 rounded-[22px] bg-blush px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 font-display text-xl font-semibold">{drill.title}</h2>
            {twists(drill).length > 0 && (
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Rules for this practice">
                {twists(drill).map((t) => (
                  <li key={t} className="rounded-md border border-wine/30 px-2 py-0.5 text-xs font-semibold text-wine">
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="m-0 leading-normal">{drill.blurb}</p>
        </div>
        <Practice
          key={lessonKey(lesson.id, step)}
          selection={{ kind: 'lesson', lessonId: lesson.id, step }}
          results={results}
          unlocked={unlocked}
          onFinish={finish}
          guide={drill.hideKeyboard ? undefined : { unlocked: keysUpTo(lesson.id), fresh: lesson.newKeys }}
          lessonOutcome={(r) =>
            passedStep(r)
              ? examLevel !== null
                ? {
                    passed: true,
                    hasNext: true,
                    message: examOpen(results, lesson.level)
                      ? `Practice passed! Your level ${lesson.level} exam is waiting.`
                      : `Lesson ${lesson.id} done! The level ${lesson.level} exam is open now.`,
                    nextLabel: 'Go to the exam',
                  }
                : { passed: true, hasNext: !isLast }
              : { passed: false, tooShort: r.correctChars < MIN_PASS_CHARS }
          }
          onNextLesson={goNext}
        />
        <p className="m-0 text-[15px] text-muted">
          Goal to unlock the next practice: <strong className="text-ink">{PASS_ACCURACY}% accuracy</strong>.{' '}
          {drill.seconds ? 'Keep going until the clock runs out. The speed is just for fun.' : 'Speed does not matter yet.'}
        </p>
      </Card>
      <Card className="sm:p-6">
        <button className="flex w-full items-center justify-between font-bold" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
          <span>Practices in this lesson</span>
          <span className="text-sm text-muted">
            {[...passed].length} of {STEPS_PER_LESSON} passed {showAll ? '▲' : '▼'}
          </span>
        </button>
        {showAll && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: STEPS_PER_LESSON }, (_, i) => i + 1).map((s) => {
              const open = isUnlocked({ lessonId, step: s }, unlocked);
              const done = passed.has(s);
              return (
                <button
                  key={s}
                  disabled={!open}
                  onClick={() => setChosen(s)}
                  aria-current={s === step ? 'step' : undefined}
                  className={`min-h-11 rounded-full px-4 font-bold ${
                    s === step ? 'bg-accent text-white' : done ? 'bg-[#CDEFD9] text-[#1E5C3A]' : open ? 'bg-petal text-wine' : 'bg-cream text-faint'
                  }`}
                >
                  {done ? '✓ ' : ''}
                  {s}. {drillFor(lesson, s).title}
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function twists(drill: Drill): string[] {
  const out: string[] = [];
  if (drill.seconds) out.push(`${drill.seconds} seconds`);
  if (drill.noBackspace) out.push('no backspace');
  if (drill.stopOnError) out.push('find the right key');
  if (drill.hideKeyboard) out.push('no keyboard');
  return out;
}
