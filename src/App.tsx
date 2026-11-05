import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { useTheme } from './lib/useTheme';
import type { Result } from './game/stats';
import { loadResults, saveResult, type SavedResult } from './lib/history';
import { newMilestones, type Milestone } from './lib/milestones';
import type { ModeKey, Selection } from './lib/modes';
import { unlockedStep } from './lib/progress';
import { useRoute } from './lib/route';
import { resumeMusicOnGesture } from './lib/sound';
import { HomePage } from './pages/HomePage';
import { LessonsPage } from './pages/LessonsPage';
import { LessonView } from './pages/LessonView';
import { NotesPage } from './pages/NotesPage';
import { PracticePage } from './pages/PracticePage';
import { ProgressPage } from './pages/ProgressPage';

export default function App() {
  useTheme();
  useEffect(resumeMusicOnGesture, []);
  const [route, go] = useRoute();
  const [results, setResults] = useState<SavedResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [practice, setPractice] = useState<Selection>({ kind: 'time', seconds: 30 });
  const [celebrate, setCelebrate] = useState<Milestone[]>([]);

  const refresh = useCallback(() => {
    loadResults()
      .then(
        (rs) => {
          setResults(rs);
          setLoadError(false);
        },
        () => setLoadError(true),
      )
      .finally(() => setLoaded(true));
  }, []);
  useEffect(refresh, [refresh]);

  const onFinish = useCallback(
    (mode: ModeKey, result: Result) => {
      const saved: SavedResult = { ...result, mode, finishedAt: Date.now() };
      const after = [saved, ...results];
      // Without the real history, milestones would be guessed from an empty list.
      const reached = loadError ? [] : newMilestones(results, after);
      if (reached.length > 0) setCelebrate(reached);
      setResults(after);
      saveResult(saved).then(
        () => setSaveError(false),
        // The in-memory copy keeps progress working for this visit even though it won't survive a reload.
        () => setSaveError(true),
      );
    },
    [results, loadError],
  );

  const practise = useCallback(
    (s: Selection) => {
      setPractice(s);
      go({ page: 'practice' });
    },
    [go],
  );

  useEffect(() => {
    if (celebrate.length === 0) return;
    const id = window.setTimeout(() => setCelebrate([]), 8000);
    return () => window.clearTimeout(id);
  }, [celebrate]);

  const unlocked = unlockedStep(results);

  return (
    <div className="flex min-h-screen flex-col">
      <Header route={route} go={go} />
      {celebrate.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-accent px-4 py-3 font-bold text-white" role="status">
          {celebrate.map((m) => (
            <span key={m.id}>🎉 {m.title}</span>
          ))}
          <button className="ml-2 rounded-full bg-white/20 px-3 py-1 text-sm" onClick={() => setCelebrate([])}>
            yay, close
          </button>
        </div>
      )}
      <main className="mx-auto box-border flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-8 sm:px-10">
        {loadError && (
          <p className="rounded-2xl bg-petal px-5 py-3 text-sm text-wine" role="alert">
            Couldn't load your past results on this browser, so progress shown here may be incomplete.
          </p>
        )}
        {saveError && (
          <p className="rounded-2xl bg-petal px-5 py-3 text-sm text-wine" role="alert">
            This result couldn't be saved, your browser may be blocking storage.
          </p>
        )}
        {!loaded ? null : route.page === 'home' ? (
          <HomePage results={results} unlocked={unlocked} go={go} practise={practise} />
        ) : route.page === 'practice' ? (
          <PracticePage selection={practice} setSelection={setPractice} results={results} unlocked={unlocked} onFinish={onFinish} />
        ) : route.page === 'lessons' ? (
          <LessonsPage results={results} unlocked={unlocked} go={go} />
        ) : route.page === 'lesson' ? (
          <LessonView key={route.lessonId} lessonId={route.lessonId} results={results} unlocked={unlocked} go={go} onFinish={onFinish} />
        ) : route.page === 'progress' ? (
          <ProgressPage results={results} practise={practise} onImported={refresh} />
        ) : (
          <NotesPage results={results} unlocked={unlocked} onFinish={onFinish} />
        )}
      </main>
      <footer className="py-6 text-center text-xs text-faint">made with love, just for you</footer>
    </div>
  );
}
