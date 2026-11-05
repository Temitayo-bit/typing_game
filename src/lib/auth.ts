import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

/** undefined while the stored session is being read, null when signed out. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(
      ({ data }) => setSession(data.session),
      () => setSession(null),
    );
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

export async function sendMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error('Accounts are not set up on this copy of the app');
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: window.location.origin },
  });
  if (!error) return;
  // The allowlist trigger rejects unknown emails; don't reveal more than that.
  if (/database error|invite only|signups not allowed/i.test(error.message)) {
    throw new Error("That email isn't on the guest list for this app");
  }
  if (error.status === 429) throw new Error('Too many links sent, please wait a few minutes and try again');
  throw new Error("Couldn't send the link, please try again");
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}
