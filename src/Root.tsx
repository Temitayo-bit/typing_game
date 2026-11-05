import { useEffect, useState } from 'react';
import App from './App';
import { ProfileForm } from './components/ProfileForm';
import { Card, Heart } from './components/ui';
import { signOut, useSession } from './lib/auth';
import { loadProfile, type Profile } from './lib/profile';
import { supabase } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';

/** Sign-in, then onboarding, then the app for that one account. */
export function Root() {
  const session = useSession();
  const userId = session?.user.id;
  // Tagged with the account it belongs to, so a different sign-in never sees the last one's profile.
  const [loaded, setLoaded] = useState<{ userId: string; profile: Profile | null; error: string | null } | null>(null);
  const current = loaded && loaded.userId === userId ? loaded : null;
  const profile = current ? current.profile : undefined;
  const error = current?.error ?? null;
  const setProfile = (p: Profile) => userId && setLoaded({ userId, profile: p, error: null });

  useEffect(() => {
    if (!userId) return;
    let live = true;
    loadProfile(userId).then(
      (p) => live && setLoaded({ userId, profile: p, error: null }),
      (e: unknown) => live && setLoaded({ userId, profile: null, error: e instanceof Error ? e.message : "Couldn't load your profile" }),
    );
    return () => {
      live = false;
    };
  }, [userId]);

  // Without a backend configured (local development) the app runs offline for one person.
  if (!supabase) return <App account={null} />;
  if (session === undefined) return <Splash />;
  if (session === null || !userId) return <LoginPage />;
  if (error) return <Splash message={error} retry={() => location.reload()} />;
  if (profile === undefined) return <Splash />;
  if (profile === null) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
        <Card className="flex flex-col gap-5 sm:p-10">
          <div className="flex items-center gap-2.5 font-display text-[26px] font-semibold text-berry">
            <Heart /> keys &amp; kisses
          </div>
          <h1 className="m-0 font-display text-3xl font-semibold">Let's set up your profile</h1>
          <p className="m-0 text-muted">A name and a photo so this space feels like yours.</p>
          <ProfileForm userId={userId} initial={null} submitLabel="Let's start" onSaved={setProfile} />
          <button className="self-start text-sm text-muted underline" onClick={() => void signOut()}>
            Not you? Sign out
          </button>
        </Card>
      </main>
    );
  }
  return <App key={userId} account={{ userId, email: session.user.email ?? '', profile, setProfile }} />;
}

function Splash({ message, retry }: { message?: string; retry?: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Heart size={40} />
      {message ? (
        <>
          <p role="alert" className="m-0 text-wine">{message}</p>
          {retry && (
            <button className="rounded-full bg-accent px-6 py-3 font-bold text-white" onClick={retry}>
              Try again
            </button>
          )}
        </>
      ) : (
        <p className="m-0 text-muted">loading…</p>
      )}
    </main>
  );
}
