import { useCallback, useState } from 'react';
import { findLesson, keysUpTo, lessons, PASS_ACCURACY, STEPS_PER_LESSON } from '../data/lessons';
import type { Result } from '../game/stats';
import type { SavedResult } from '../lib/history';
import { lessonKey, type ModeKey } from '../lib/modes';
import { isUnlocked, nextStep, passedStep, passedStepsOf, type StepRef } from '../lib/progress';
import type { Route } from '../lib/route';
import { Card } from '../components/ui';
import { Practice } from './Practice';

type Props = {
  lessonId: number;
  results: SavedResult[];
  unlocked: StepRef;
  go: (r: Route) => void;
  onFinish: (key: ModeKey, r: Result) => void;
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

  const goNext = useCallback(() => {
    const next = nextStep({ lessonId, step });
    if (!next) return;
    if (next.lessonId === lessonId) setChosen(next.step);
    else go({ page: 'lesson', lessonId: next.lessonId });
  }, [lessonId, step, go, setChosen]);

  // Pin the step so unlocking the next one doesn't swap out the result screen.
  const finish = useCallback(
    (key: ModeKey, r: Result) => {
      setChosen(step);
      onFinish(key, r);
    },
    [step, onFinish, setChosen],
  );

  if (!lesson || !isUnlocked({ lessonId, step: 1 }, unlocked)) {
    return (
      <Card className="text-center">
        <p className="text-lg">This lesson is still locked. Finish the one before it first.</p>
        <button className="mt-4 font-bold text-berry" onClick={() => go({ page: 'lessons' })}>
          Back to all lessons
        </button>
      </Card>
    );
  }

  const isLast = lesson.id === lessons.length && step === STEPS_PER_LESSON;
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
        <Practice
          key={lessonKey(lesson.id, step)}
          selection={{ kind: 'lesson', lessonId: lesson.id, step }}
          results={results}
          unlocked={unlocked}
          onFinish={finish}
          guide={{ unlocked: keysUpTo(lesson.id), fresh: lesson.newKeys }}
          lessonOutcome={(r) => (passedStep(r) ? { passed: true, hasNext: !isLast } : { passed: false })}
          onNextLesson={goNext}
        />
        <p className="m-0 text-[15px] text-muted">
          Goal to unlock the next practice: <strong className="text-ink">{PASS_ACCURACY}% accuracy</strong>. Speed does not matter yet.
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
                  {done ? '✓ ' : ''}Practice {s}
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
