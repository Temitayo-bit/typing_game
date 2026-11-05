import { useState, type FormEvent } from 'react';
import { Card, Heart } from '../components/ui';
import { sendMagicLink, takeLinkError } from '../lib/auth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(takeLinkError);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState('sending');
    setError(null);
    try {
      await sendMagicLink(email);
      setState('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the link");
      setState('idle');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <Card className="flex flex-col gap-5 sm:p-10">
        <div className="flex items-center gap-2.5 font-display text-[26px] font-semibold text-berry">
          <Heart /> keys &amp; kisses
        </div>
        {state === 'sent' ? (
          <div role="status" className="flex flex-col gap-2">
            <h1 className="m-0 font-display text-3xl font-semibold">Check your email</h1>
            <p className="m-0 text-muted">
              If <strong className="text-ink">{email.trim()}</strong> is invited, a sign-in link is on its way. Open it in this browser to
              come straight in.
            </p>
            <button className="self-start text-sm font-bold text-berry underline" onClick={() => setState('idle')}>
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <h1 className="m-0 font-display text-3xl font-semibold">Welcome</h1>
            <p className="m-0 text-muted">Enter your email and we'll send you a magic link. No password needed.</p>
            <label className="flex flex-col gap-1.5 font-bold">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-12 rounded-2xl border border-line bg-cream px-4 font-normal"
              />
            </label>
            {error && <p role="alert" className="m-0 text-sm font-bold text-error">{error}</p>}
            <button
              type="submit"
              disabled={state === 'sending'}
              className="min-h-12 rounded-full bg-accent px-6 font-bold text-white hover:bg-berry disabled:opacity-50"
            >
              {state === 'sending' ? 'Sending…' : 'Send my link'}
            </button>
          </form>
        )}
      </Card>
    </main>
  );
}
