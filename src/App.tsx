import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { useTheme } from './lib/useTheme';
import type { Result } from './game/stats';
import { claimLegacyResults, loadResults, saveResult, switchHistory, type SavedResult } from './lib/history';
import { newMilestones, type Milestone } from './lib/milestones';
import type { ModeKey, Selection } from './lib/modes';
import { unlockedStep } from './lib/progress';
import { useRoute } from './lib/route';
import { hasUnsynced, loadSettings, markUnsynced, type Settings } from './lib/settings';
import { photoUrl } from './lib/profile';
import { backUpResult, pullSettings, pushSettings, syncResults } from './lib/sync';
import { ProfilePage, type Account } from './pages/ProfilePage';
import { applySettings, resumeMusicOnGesture, switchSettings } from './lib/sound';
import { HomePage } from './pages/HomePage';
import { LessonsPage } from './pages/LessonsPage';
import { LessonView } from './pages/LessonView';
import { NotesPage } from './pages/NotesPage';
import { PracticePage } from './pages/PracticePage';
import { ProgressPage } from './pages/ProgressPage';

function pushOwnSettings(userId: string, s: Settings): void {
  markUnsynced(userId, true);
  pushSettings(s).then(() => markUnsynced(userId, false), () => undefined);
}

export default function App({ account }: { account: Account | null }) {
  // App is keyed by account, so this runs once per signed-in person before anything loads.
  const userId = account?.userId ?? null;
  useState(() => {
    switchHistory(userId);
    switchSettings(userId, userId ? (s) => pushOwnSettings(userId, s) : null);
    return null;
  });
  // Signing out unmounts this App: leave nothing of this account running behind the login screen.
  useEffect(
    () => () => {
      switchSettings(null);
      switchHistory(null);
    },
    [],
  );
  useTheme();
  useEffect(resumeMusicOnGesture, []);
  const [route, go] = useRoute();
  const [results, setResults] = useState<SavedResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [practice, setPractice] = useState<Selection>({ kind: 'time', seconds: 30 });
  const [celebrate, setCelebrate] = useState<Milestone[]>([]);

  const [offline, setOffline] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const refresh = useCallback(() => {
    (userId ? claimLegacyResults(userId).catch(() => undefined) : Promise.resolve())
      .then(loadResults)
      .then(
        (rs) => {
          setResults(rs);
          setLoadError(false);
        },
        () => setLoadError(true),
      )
      .finally(() => setLoaded(true));
  }, [userId]);
  useEffect(refresh, [refresh]);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    // Pull anything saved on other devices, push anything only this browser has.
    syncResults(userId, () => current).then(
      (pulled) => {
        if (!current) return;
        setOffline(false);
        if (pulled > 0) refresh();
      },
      () => current && setOffline(true),
    );
    // Local edits the server never confirmed win over the server copy.
    if (hasUnsynced(userId)) pushOwnSettings(userId, loadSettings(userId));
    else
      pullSettings().then(
        (remote) => {
          if (!current || hasUnsynced(userId)) return;
          if (remote) applySettings(remote);
          else pushOwnSettings(userId, loadSettings(userId));
        },
        () => undefined,
      );
    return () => {
      current = false;
    };
  }, [userId, refresh]);

  const avatarPath = account?.profile.avatarPath;
  useEffect(() => {
    let live = true;
    const load = () => avatarPath && photoUrl(avatarPath).then((u) => live && setPhoto(u));
    load();
    // Signed links expire, so refresh well before that for a tab left open.
    const timer = window.setInterval(load, 45 * 60 * 1000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [avatarPath]);

  const onFinish = useCallback(
    (mode: ModeKey, result: Result) => {
      const saved: SavedResult = { ...result, mode, finishedAt: Date.now() };
      const after = [saved, ...results];
      // Without the real history, milestones would be guessed from an empty list.
      const reached = loadError ? [] : newMilestones(results, after);
      if (reached.length > 0) setCelebrate(reached);
      setResults(after);
      saveResult(saved).then(
        () => {
          setSaveError(false);
          // A failed backup is retried by the next sync, so it only flags the offline note.
          if (userId) backUpResult(userId, saved).then(() => setOffline(false), () => setOffline(true));
        },
        // The in-memory copy keeps progress working for this visit even though it won't survive a reload.
        () => setSaveError(true),
      );
    },
    [results, loadError, userId],
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
  const name = account?.profile.displayName ?? 'there';

  return (
    <div className="flex min-h-screen flex-col">
      <Header route={route} go={go} name={name} photo={photo} />
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
        {offline && (
          <p className="rounded-2xl bg-petal px-5 py-3 text-sm text-wine" role="status">
            Can't reach the server right now. Your results are safe on this device and will back up next time.
          </p>
        )}
        {saveError && (
          <p className="rounded-2xl bg-petal px-5 py-3 text-sm text-wine" role="alert">
            This result couldn't be saved, your browser may be blocking storage.
          </p>
        )}
        {!loaded ? null : route.page === 'home' ? (
          <HomePage results={results} unlocked={unlocked} go={go} practise={practise} name={name} />
        ) : route.page === 'practice' ? (
          <PracticePage selection={practice} setSelection={setPractice} results={results} unlocked={unlocked} onFinish={onFinish} />
        ) : route.page === 'lessons' ? (
          <LessonsPage results={results} unlocked={unlocked} go={go} />
        ) : route.page === 'lesson' ? (
          <LessonView key={route.lessonId} lessonId={route.lessonId} results={results} unlocked={unlocked} go={go} onFinish={onFinish} />
        ) : route.page === 'progress' ? (
          <ProgressPage results={results} practise={practise} onImported={refresh} />
        ) : route.page === 'profile' ? (
          <ProfilePage account={account} />
        ) : (
          <NotesPage results={results} unlocked={unlocked} onFinish={onFinish} />
        )}
      </main>
      <footer className="py-6 text-center text-xs text-faint">made with love, just for you</footer>
    </div>
  );
}
