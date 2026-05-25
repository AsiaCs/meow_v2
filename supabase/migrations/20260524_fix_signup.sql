-- ============================================================================
-- Fix: "Database error saving new user" on signup
--
-- Cause: a handle_new_user trigger on auth.users tries to insert into
-- public.users, but the public.users table has columns that are NOT NULL
-- without defaults (e.g. interests, onboarded, name). The trigger insert
-- only supplies (id, email) and fails the NOT NULL check.
--
-- Run this whole file in: Supabase Dashboard -> SQL Editor -> + New query
-- ============================================================================

-- 1. Make every column in public.users that might be NOT NULL have a sane
--    default. Idempotent — safe to re-run.
alter table public.users
  alter column "name"           drop not null,
  alter column "image"          drop not null,
  alter column "location"       drop not null;

alter table public.users
  alter column "interests"      set default '{}'::text[];

alter table public.users
  alter column "onboarded"      set default false;

-- Backfill any existing rows that violate the new constraints (defensive).
update public.users set "interests" = '{}'::text[] where "interests" is null;
update public.users set "onboarded" = false        where "onboarded" is null;

-- 2. Ensure the digest column we added in commit 316e365 exists and is
--    nullable with a sane default. Pre-existing rows treated as opted-in.
alter table public.users
  add column if not exists "digestEnabled" boolean default true;

-- 3. Replace the new-user trigger with a permissive version that only inserts
--    the columns we know are safe. Anything that needs a real value goes
--    through the /api/onboarding flow later.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, "createdAt", "updatedAt")
  values (new.id, new.email, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Rewire the trigger to use the fixed function. Drops the old trigger if any.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Tighten RLS so users can read/update their own row. Safe to re-apply.
alter table public.users enable row level security;

drop policy if exists "users_self_select" on public.users;
create policy "users_self_select"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update"
  on public.users for update
  using (auth.uid() = id);

-- The handle_new_user trigger runs as SECURITY DEFINER so it bypasses RLS
-- for the initial insert. No additional insert policy needed.

-- ============================================================================
-- After running this, signup should work. If you still see "Database error
-- saving new user", check the Supabase Dashboard -> Logs -> Postgres tab
-- for the exact constraint that's failing and paste the error.
-- ============================================================================
