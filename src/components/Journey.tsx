import { lessons, levels } from '../data/lessons';
import { levelOf } from '../data/exams';
import type { SavedResult } from '../lib/history';
import { certificateEarned, comparableTests, firstComparable, growthSeries, levelProgress, nextUp, typicalWpm, type LevelProgress } from '../lib/exams';
import { reachedMilestones } from '../lib/milestones';
import { dayStreak, lessonStatus, type StepRef } from '../lib/progress';
import type { Route } from '../lib/route';
import { LineChart } from './LineChart';
import { Stars } from './Stars';
import { Button, Card } from './ui';

type Props = { results: SavedResult[]; unlocked: StepRef; go: (r: Route) => void };

/** Where she is in the course, how she has grown, and the certificate waiting at the end. */
export function Journey({ results, unlocked, go }: Props) {
  const journey = levelProgress(results, unlocked);
  const level = levelOf(unlocked.lessonId) ?? 1;
  const here = journey.find((j) => j.level === level)!;
  const lessonsDone = lessons.filter((l) => lessonStatus(results, l.id, unlocked).state === 'done').length;
  const examsPassed = journey.filter((j) => j.state === 'passed').length;
  const next = nextUp(results, unlocked);
  const series = growthSeries(results);
  const typical = typicalWpm(results);
  const first = firstComparable(results);
  const best = comparableTests(results).reduce<SavedResult | undefined>((b, r) => (!b || r.wpm > b.wpm ? r : b), undefined);
  const milestones = reachedMilestones(results);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-wrap items-center gap-6">
        <Ring done={lessonsDone} total={lessons.length} />
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
          <div className="text-sm font-bold tracking-[0.08em] text-berry uppercase">
            You are on level {level} of {levels.length}
          </div>
          <h2 className="m-0 font-display text-[28px] font-semibold text-balance">{here.title}</h2>
          <p className="m-0 text-muted">
            {next.kind === 'exam'
              ? `Every lesson in level ${next.level} is done. The exam is all that stands between you and level ${next.level + 1}.`
              : `Next up: lesson ${next.lessonId}.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip strong={`${examsPassed}`} rest={`of ${levels.length} exams passed`} />
            <Chip strong={`${dayStreak(results)}`} rest="day streak" />
          </div>
          <div className="mt-1">
            {next.kind === 'exam' ? (
              <Button onClick={() => go({ page: 'exam', level: next.level })}>Take the level {next.level} exam</Button>
            ) : (
              <Button kind="soft" onClick={() => go({ page: 'lesson', lessonId: next.lessonId })}>
                Continue lesson {next.lessonId}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-6">
        <Card className="flex min-w-0 flex-[999_1_520px] flex-col gap-2.5">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-bold">How you've grown</span>
            <span className="text-sm text-muted">dots are exams passed</span>
          </div>
          <LineChart points={series.map((p) => p.wpm)} label="Words per minute over time, with exams marked" xLabel="latest" highlight={(i) => series[i]?.exam === true} />
          <p className="m-0 text-sm text-muted">Practice tests of 30 seconds or more, and exams. Lesson practices aren't counted, since early ones use only a few keys.</p>
        </Card>
        <Card className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <span className="font-bold">Day one vs today</span>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Typical now" value={typical ? `${Math.round(typical.wpm)} wpm` : '–'} note={typical ? `middle of your last ${typical.of} tests` : 'after 3 tests of 30s or more'} />
            <Stat label="Best ever" value={best ? `${Math.round(best.wpm)} wpm` : '–'} />
          </div>
          {first && typical ? (
            <p className="m-0">
              You started at <strong>{Math.round(first.wpm)} wpm</strong> and {Math.round(first.accuracy)}% accuracy.{' '}
              {typical.wpm > first.wpm ? (
                <strong className="text-berry">That's +{Math.round(typical.wpm - first.wpm)} wpm since your first test.</strong>
              ) : (
                'Keep going, the line climbs with practice.'
              )}
            </p>
          ) : (
            <p className="m-0 text-muted">Do a few 30-second tests on the Practice page and your growth shows up here.</p>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-1">
        <span className="mb-2 font-bold">Your journey</span>
        <ol className="m-0 flex list-none flex-col p-0">
          {journey.map((j) => (
            <Stop key={j.level} j={j} current={j.level === level} go={go} />
          ))}
          <li className="grid grid-cols-[44px_1fr] items-center gap-3.5 py-2">
            <span className={`flex h-11 w-11 items-center justify-center rounded-[14px] border-2 font-bold ${certificateEarned(results) ? 'border-[#C98A1B] bg-[#C98A1B] text-white' : 'border-[#C98A1B] bg-[#FFF1D6] text-[#8A5A0B]'}`}>★</span>
            <div className="rounded-[16px] border-2 border-dashed border-[#C98A1B] bg-[#FFF1D6] px-4 py-3 text-[#5C3B06]">
              <div className="font-display text-lg font-semibold">Your certificate</div>
              <div className="text-sm">
                {certificateEarned(results)
                  ? 'You passed every exam. Your certificate is on its way!'
                  : `Pass all ${levels.length} level exams to unlock it. ${levels.length - examsPassed} to go.`}
              </div>
            </div>
          </li>
        </ol>
      </Card>

      {milestones.length > 0 && (
        <Card className="flex flex-col gap-3">
          <span className="font-bold">Milestones</span>
          <div className="flex flex-wrap gap-2">
            {milestones.map((m) => (
              <span key={m.id} className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-wine">
                {m.title}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Stop({ j, current, go }: { j: LevelProgress; current: boolean; go: (r: Route) => void }) {
  const done = j.state === 'passed';
  return (
    <li className="relative grid grid-cols-[44px_1fr] items-center gap-x-3.5 gap-y-1 py-2 sm:grid-cols-[44px_1fr_auto]">
      <span aria-hidden="true" className={`absolute top-0 bottom-0 left-[20px] w-[3px] ${done ? 'bg-rose' : 'bg-line'}`} />
      <span
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border-[3px] font-display text-lg font-semibold ${
          done ? 'border-accent bg-accent text-white' : current ? 'border-accent bg-white text-accent ring-4 ring-petal' : 'border-line bg-white text-faint'
        }`}
      >
        {j.level}
      </span>
      <div className="min-w-0">
        <div className={`font-display text-base font-semibold ${j.state === 'locked' ? 'text-faint' : ''}`}>{j.title}</div>
        <div className="text-sm text-muted">
          Lessons {j.firstLesson} to {j.lastLesson} · {j.lessonsDone} of {j.lastLesson - j.firstLesson + 1} done
        </div>
      </div>
      <div className="col-start-2 sm:col-start-3">
        {done && j.best ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#CDEFD9] px-3 py-1.5 text-sm font-bold text-[#1E5C3A]">
            {Math.round(j.best.accuracy)}% · {Math.round(j.best.wpm)} wpm <Stars n={j.stars} />
          </span>
        ) : j.state === 'exam-ready' ? (
          <button className="rounded-xl bg-accent px-3 py-1.5 text-sm font-bold text-white hover:bg-berry" onClick={() => go({ page: 'exam', level: j.level })}>
            Take the exam
          </button>
        ) : j.state === 'learning' ? (
          <span className="rounded-xl bg-petal px-3 py-1.5 text-sm font-bold text-wine">Exam after lesson {j.lastLesson}</span>
        ) : (
          <span className="rounded-xl border border-dashed border-line px-3 py-1.5 text-sm font-bold text-faint">Locked</span>
        )}
      </div>
    </li>
  );
}

function Ring({ done, total }: { done: number; total: number }) {
  const c = 2 * Math.PI * 50;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label={`${done} of ${total} lessons done`}>
      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-petal)" strokeWidth="12" />
      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-accent)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(done / total) * c} ${c}`} transform="rotate(-90 60 60)" />
      <text x="60" y="60" textAnchor="middle" className="font-display" fontSize="28" fontWeight="600" fill="var(--color-ink)">{done}</text>
      <text x="60" y="80" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-muted)">of {total} lessons</text>
    </svg>
  );
}

function Chip({ strong, rest }: { strong: string; rest: string }) {
  return (
    <span className="rounded-full bg-petal px-3 py-1 text-sm font-bold">
      <span className="text-berry">{strong}</span> {rest}
    </span>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[18px] bg-petal px-4 py-3">
      <div className="text-xs font-bold tracking-[0.08em] text-wine uppercase">{label}</div>
      <div className="font-display text-[26px] font-semibold">{value}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </div>
  );
}
