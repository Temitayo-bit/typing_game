-- Allowlisted emails may only sign in by magic link: a password sign-up would let
-- someone who knows an invited address claim it before its owner does.
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
  if coalesce(new.encrypted_password, '') <> '' then
    raise exception 'sign-ups are invite only';
  end if;
  return new;
end;
$$;

-- Bound the per-result payloads so storage can't grow without limit.
alter table public.results
  add constraint results_missed_keys_size check (pg_column_size(missed_keys) <= 4096),
  add constraint results_wpm_by_second_size check (jsonb_array_length(wpm_by_second) <= 3600);
