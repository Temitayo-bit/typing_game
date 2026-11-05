import { useEffect, useState, type FormEvent } from 'react';
import { photoProblem, photoUrl, saveProfile, uploadPhoto, type Profile } from '../lib/profile';

type Props = { userId: string; initial: Profile | null; submitLabel: string; onSaved: (p: Profile) => void };

const today = new Date().toISOString().slice(0, 10);

/** Name, birthday, typing goal and a required photo. Used for onboarding and for editing. */
export function ProfileForm({ userId, initial, submitLabel, onSaved }: Props) {
  const [name, setName] = useState(initial?.displayName ?? '');
  const [birthday, setBirthday] = useState(initial?.birthday ?? '');
  const [goal, setGoal] = useState(initial?.goalWpm ? String(initial.goalWpm) : '');
  const [file, setFile] = useState<{ file: File; url: string } | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = file?.url ?? saved;
  useEffect(() => () => {
    if (file) URL.revokeObjectURL(file.url);
  }, [file]);
  useEffect(() => {
    let live = true;
    if (initial?.avatarPath) photoUrl(initial.avatarPath).then((u) => live && setSaved(u));
    return () => {
      live = false;
    };
  }, [initial?.avatarPath]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Please tell us your name');
    if (!file && !initial?.avatarPath) return setError('Please add a photo, it shows on your profile');
    const goalWpm = goal ? Number(goal) : null;
    if (goalWpm !== null && !(Number.isInteger(goalWpm) && goalWpm >= 5 && goalWpm <= 200)) {
      return setError('A speed goal is a whole number between 5 and 200');
    }
    setSaving(true);
    setError(null);
    try {
      const avatarPath = file ? await uploadPhoto(userId, file.file) : initial!.avatarPath;
      const profile: Profile = { displayName: name.trim(), birthday: birthday || null, avatarPath, goalWpm };
      await saveProfile(userId, profile);
      onSaved(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save, please try again");
    } finally {
      setSaving(false);
    }
  }

  const field = 'min-h-12 rounded-2xl border border-line bg-cream px-4 font-normal';
  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-petal text-sm text-muted">
          {preview ? <img src={preview} alt="Your photo" className="h-full w-full object-cover" /> : 'no photo'}
        </div>
        <label className="flex flex-col gap-1.5 font-bold">
          Profile photo {initial?.avatarPath ? '' : '(required)'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              const problem = f && photoProblem(f);
              setError(problem || null);
              setFile(f && !problem ? { file: f, url: URL.createObjectURL(f) } : null);
            }}
            className="text-sm font-normal"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 font-bold">
        What should we call you?
        <input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="given-name" />
      </label>
      <label className="flex flex-col gap-1.5 font-bold">
        Birthday <span className="text-sm font-normal text-muted">(optional, for a little surprise on the day)</span>
        <input type="date" value={birthday} max={today} onChange={(e) => setBirthday(e.target.value)} className={field} />
      </label>
      <label className="flex flex-col gap-1.5 font-bold">
        Speed goal in wpm <span className="text-sm font-normal text-muted">(optional)</span>
        <input type="number" inputMode="numeric" min={5} max={200} value={goal} onChange={(e) => setGoal(e.target.value)} className={field} />
      </label>
      {error && <p role="alert" className="m-0 text-sm font-bold text-error">{error}</p>}
      <button type="submit" disabled={saving} className="min-h-12 self-start rounded-full bg-accent px-8 font-bold text-white hover:bg-berry disabled:opacity-50">
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
