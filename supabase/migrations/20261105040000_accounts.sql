-- Accounts, per-user data and avatars. Every table is owner-only through RLS.

-- Sign-ups are limited to an allowlist kept outside the API-exposed schemas.
-- The addresses are inserted separately so they never live in the repo.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.signup_allowlist (
  email text primary key check (email = lower(email))
);

create or replace function private.enforce_signup_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or not exists (
    select 1 from private.signup_allowlist a where a.email = lower(new.email)
  ) then
    raise exception 'sign-ups are invite only';
  end if;
  return new;
end;
$$;

create trigger enforce_signup_allowlist
  before insert on auth.users
  for each row execute function private.enforce_signup_allowlist();

-- Profiles: filled in during onboarding. A photo is required.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  birthday date check (birthday between date '1900-01-01' and current_date),
  avatar_path text not null check (char_length(avatar_path) between 1 and 200),
  goal_wpm smallint check (goal_wpm between 5 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: create own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Test results: written once per finished test, never per keystroke.
create table public.results (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mode text not null check (mode ~ '^(?:(?:time|words)-\d+|lesson-\d+-\d+|weak-keys|(?:pack|note)-[a-z0-9-]+)$'),
  finished_at bigint not null check (finished_at > 0),
  wpm real not null check (wpm >= 0),
  raw_wpm real not null check (raw_wpm >= 0),
  accuracy real not null check (accuracy between 0 and 100),
  correct_chars integer not null check (correct_chars >= 0),
  typed_chars integer not null check (typed_chars >= 0),
  duration_ms integer not null check (duration_ms >= 0),
  missed_keys jsonb not null default '{}' check (jsonb_typeof(missed_keys) = 'object'),
  wpm_by_second jsonb not null default '[]' check (jsonb_typeof(wpm_by_second) = 'array'),
  created_at timestamptz not null default now(),
  -- Makes sync idempotent: re-uploading the same local result is a no-op.
  unique (user_id, finished_at, mode)
);

alter table public.results enable row level security;

create policy "results: read own" on public.results
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "results: add own" on public.results
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Settings: one row per user.
create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  sounds boolean not null default true,
  music boolean not null default false,
  theme text not null default 'rose' check (theme in ('rose', 'lavender', 'peach', 'mint')),
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "settings: read own" on public.settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "settings: create own" on public.settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "settings: update own" on public.settings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Avatars: private bucket, each user may only touch files under their own id folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy "avatars: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: replace own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Keep-alive: a tiny read the scheduled GitHub Action calls so the free project doesn't pause.
create or replace function public.keep_alive()
returns text
language sql
stable
set search_path = ''
as $$ select 'ok'::text $$;

revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;

-- After applying, add the allowed emails (kept out of the repo):
--   insert into private.signup_allowlist (email) values ('someone@example.com');
