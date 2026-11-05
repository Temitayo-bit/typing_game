import { supabase } from './supabase';

export type Profile = { displayName: string; birthday: string | null; avatarPath: string; goalWpm: number | null };

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function client() {
  if (!supabase) throw new Error('Accounts are not set up on this copy of the app');
  return supabase;
}

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await client()
    .from('profiles')
    .select('display_name, birthday, avatar_path, goal_wpm')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error("Couldn't load your profile");
  if (!data) return null;
  return { displayName: data.display_name, birthday: data.birthday, avatarPath: data.avatar_path, goalWpm: data.goal_wpm };
}

export async function saveProfile(userId: string, p: Profile): Promise<void> {
  const { error } = await client().from('profiles').upsert({
    id: userId,
    display_name: p.displayName.trim(),
    birthday: p.birthday,
    avatar_path: p.avatarPath,
    goal_wpm: p.goalWpm,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("Couldn't save your profile, please try again");
}

export function photoProblem(file: File): string | null {
  if (!(file.type in PHOTO_TYPES)) return 'Please pick a JPG, PNG or WebP photo';
  if (file.size > MAX_PHOTO_BYTES) return 'That photo is over 2 MB, please pick a smaller one';
  return null;
}

/** Uploads a profile photo into the account's own folder and returns its storage path. */
export async function uploadPhoto(userId: string, file: File): Promise<string> {
  const problem = photoProblem(file);
  if (problem) throw new Error(problem);
  // A fresh name each time so cached old photos never show after a change.
  const path = `${userId}/avatar-${Date.now()}.${PHOTO_TYPES[file.type]}`;
  const { error } = await client().storage.from('avatars').upload(path, file, { contentType: file.type });
  if (error) throw new Error("Couldn't upload that photo, please try again");
  return path;
}

/** Best effort: an old photo left behind only costs a little storage. */
export async function deletePhoto(path: string): Promise<void> {
  await client().storage.from('avatars').remove([path]).catch(() => undefined);
}

export async function photoUrl(path: string): Promise<string | null> {
  const { data, error } = await client().storage.from('avatars').createSignedUrl(path, 60 * 60);
  return error ? null : data.signedUrl;
}
