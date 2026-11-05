import { useCallback, useState } from 'react';
import { EXAM_SECONDS, findLevel, lessonsInLevel, NEW_SHARE, starsFor, starTargets } from '../data/exams';
import { levels, PASS_ACCURACY } from '../data/lessons';
import type { Result } from '../game/stats';
import type { SavedResult } from '../lib/history';
import type { ModeKey } from '../lib/modes';
import { examOpen, MIN_PASS_CHARS, passedExam, passedStep, type StepRef } from '../lib/progress';
import { levelProgress } from '../lib/exams';
import type { Route } from '../lib/route';
import type { LessonOutcome } from '../components/ResultCard';
import { Button, Card } from '../components/ui';
import { Stars } from '../components/Stars';
import { Practice } from './Practice';

type Props = {
  level: number;
  results: SavedResult[];
  unlocked: StepRef;
  go: (r: Route) => void;
  onFinish: (key: ModeKey, r: Result, textKeys?: string[]) => void;
  onDrillKeys: (keys: string[]) => void;
};

export function ExamView({ level, results, unlocked, go, onFinish, onDrillKeys }: Props) {
  const [started, setStarted] = useState(false);
  // Fixed when the try starts, so a retake doesn't announce a level that was already open.
  const [retake, setRetake] = useState(false);
  const info = findLevel(level);
  const lessons = lessonsInLevel(level);
  const isFinal = level === levels.at(-1)?.id;
  const nextLesson = lessonsInLevel(level + 1)[0];

  const outcome = useCallback(
    (r: Result): LessonOutcome => {
      if (passedStep(r)) {
        const stars = starsFor(level, r.wpm);
        const starText = stars === 3 ? ' Three stars, too!' : stars > 0 ? ` ${stars} of 3 stars.` : '';
        if (retake) return { passed: true, hasNext: true, message: `Passed again, nice!${starText}`, nextLabel: 'Back to lessons' };
        return {
          passed: true,
          hasNext: true,
          message: isFinal
            ? `Level ${level} passed. That was the final exam!${starText}`
            : `Level ${level} passed! Level ${level + 1} is open now.${starText}`,
          nextLabel: nextLesson ? `Start lesson ${nextLesson.id}` : 'See your milestones',
        };
      }
      if (r.correctChars < MIN_PASS_CHARS) return { passed: false, tooShort: true, message: 'Keep typing until the clock runs out, then it counts.' };
      return {
        passed: false,
        message: `So close. ${Math.round(r.accuracy)}% accuracy, you need ${PASS_ACCURACY}%. Nothing is lost, try as many times as you like.`,
        nextLabel: 'Try the exam again',
      };
    },
    [level, isFinal, nextLesson, retake],
  );

  if (!info || !examOpen(results, level)) {
    const last = lessons.at(-1);
    return (
      <Card className="text-center">
        <p className="text-lg">This exam opens once you finish {last ? `lesson ${last.id}` : 'this level'}.</p>
        <button className="mt-4 font-bold text-berry" onClick={() => go({ page: 'lessons' })}>
          Back to all lessons
        </button>
      </Card>
    );
  }

  const progress = levelProgress(results, unlocked).find((p) => p.level === level);
  const targets = starTargets(level);

  return (
    <div className="flex flex-col gap-5">
      <button className="self-start font-bold text-berry hover:text-wine" onClick={() => go({ page: 'lessons' })}>
        ← All lessons
      </button>
      <Card className="flex flex-col gap-5 sm:p-8">
        <div className="text-sm font-bold tracking-[0.08em] text-berry uppercase">Level {level} exam</div>
        <h1 className="m-0 font-display text-[30px] font-semibold">{info.title}</h1>
        <p className="m-0 max-w-[65ch] leading-normal text-muted">
          One test with everything you have learned so far.{' '}
          {level > 1
            ? `About ${Math.round(NEW_SHARE * 10)} in 10 words come from this level, and the rest mix in earlier ones so nothing gets rusty.`
            : 'It uses every key from this level.'}
        </p>
        {!started ? (
          <>
            <div className="flex flex-wrap gap-3">
              <Rule label="This level" value={lessons.map((l) => l.title).join(' · ')} wide />
              {level > 1 && <Rule label="Also mixed in" value={level === 2 ? 'Level 1' : level === 3 ? 'Levels 1 and 2' : `Levels 1 to ${level - 1}`} />}
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
              <Rule label="Length" value={`${EXAM_SECONDS} seconds`} />
              <Rule label="To pass" value={`${PASS_ACCURACY}% accuracy`} />
              <Rule label="Stars" value={`${targets.join(' / ')} wpm`} note="Speed earns stars and never fails you." />
              <Rule label="Tries" value="As many as you like" note="Your best one counts." />
            </div>
            {progress?.best && (
              <p className="m-0 flex items-center gap-2 text-muted">
                Best so far: {Math.round(progress.best.accuracy)}% · {Math.round(progress.best.wpm)} wpm <Stars n={progress.stars} />
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => {
                  setRetake(passedExam(results, level));
                  setStarted(true);
                }}
              >{passedExam(results, level) ? 'Take it again' : 'Start exam'}</Button>
              <span className="text-sm text-muted">The keyboard picture stays off in exams.</span>
            </div>
          </>
        ) : (
          <Practice
            selection={{ kind: 'exam', level }}
            results={results}
            unlocked={unlocked}
            onFinish={onFinish}
            lessonOutcome={outcome}
            onNextLesson={() => go(retake ? { page: 'lessons' } : nextLesson ? { page: 'lesson', lessonId: nextLesson.id } : { page: 'progress' })}
            onDrillKeys={onDrillKeys}
          />
        )}
      </Card>
    </div>
  );
}

function Rule({ label, value, note, wide }: { label: string; value: string; note?: string; wide?: boolean }) {
  return (
    <div className={`min-w-0 rounded-[18px] bg-petal px-4 py-3 ${wide ? 'flex-[2_1_320px]' : 'flex-[1_1_160px]'}`}>
      <div className="text-xs font-bold tracking-[0.08em] text-wine uppercase">{label}</div>
      <div className="font-bold">{value}</div>
      {note && <div className="text-sm text-muted">{note}</div>}
    </div>
  );
}
