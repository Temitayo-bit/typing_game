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
  // Unknown emails are refused by the server's allowlist. Answer exactly as for a sent link,
  // so the form can't be used to find out who is invited.
  if (/database error|invite only|signups not allowed/i.test(error.message)) return;
  if (error.status === 429) throw new Error('Too many links sent, please wait a few minutes and try again');
  throw new Error("Couldn't send the link, please try again");
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  // A failed server call still clears this browser's session.
  if (error) await supabase.auth.signOut({ scope: 'local' });
}

/** An expired or reused magic link comes back as an error in the URL. Reads and clears it. */
export function takeLinkError(): string | null {
  const params = new URLSearchParams(location.hash.slice(1) || location.search.slice(1));
  const code = params.get('error_code') ?? params.get('error');
  if (!code) return null;
  history.replaceState(null, '', location.pathname);
  return code === 'otp_expired'
    ? 'That sign-in link has expired or was already used. Send yourself a new one.'
    : "That sign-in link didn't work. Send yourself a new one.";
}
