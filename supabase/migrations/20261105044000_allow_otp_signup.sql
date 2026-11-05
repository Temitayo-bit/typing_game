-- Magic-link sign-ups also get a random password from Auth, so the password check in
-- 20261105043000_harden.sql blocked real users. Back to the allowlist check only.
-- Once every invited person has signed in, turn off "Allow new users to sign up" in
-- Auth settings so an invited address can't be claimed by someone else.
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
