-- ============================================================================
-- Harden Row Level Security across all app tables.
--
-- WHY: an external check found that an anonymous request (anon API key) could
-- read the entire `users` table — including email addresses — and the
-- `experiences` table. That means RLS is either disabled or has a permissive
-- read policy on those tables. This migration locks reads to the owner while
-- keeping the public catalog (events, internships) readable.
--
-- The app writes through the *authenticated* Supabase client (see
-- app/api/profile, app/api/experience, app/api/submit), so owner write
-- policies are required for the app to keep working. Server-only jobs
-- (scrapers, weekly digest) must use SUPABASE_SERVICE_ROLE_KEY, which bypasses
-- RLS — make sure that env var is set in production after applying this.
--
-- Run in: Supabase Dashboard -> SQL Editor -> + New query -> paste -> Run.
-- Idempotent: safe to run more than once.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- FIRST: drop EVERY existing policy on the two private tables. The project
-- shipped with a permissive "allow all" SELECT policy on users/experiences;
-- because RLS combines policies with OR, leaving it in place lets anon keep
-- reading even after we add restrictive policies. This loop removes whatever
-- is there so only the owner-only policies below remain.
-- ---------------------------------------------------------------------------
do $$
declare pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename in ('users','experiences')
  loop
    execute format('drop policy if exists %I on %I.%I',
                   pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- users — private. Each person can see and edit only their own row.
-- ---------------------------------------------------------------------------
-- NOTE ON CASTS: this schema is Prisma-generated, so `id` and `userId` are
-- `text` columns while auth.uid() returns `uuid`. Comparing them directly
-- throws `operator does not exist: uuid = text`. Casting both sides to text
-- (`col::text`) works whether the column is text OR uuid, so these policies
-- are safe regardless of the exact column type.
alter table public.users enable row level security;

drop policy if exists "users_self_select" on public.users;
create policy "users_self_select" on public.users
  for select using ((select auth.uid())::text = id::text);

drop policy if exists "users_self_insert" on public.users;
create policy "users_self_insert" on public.users
  for insert with check ((select auth.uid())::text = id::text);

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users
  for update using ((select auth.uid())::text = id::text)
  with check ((select auth.uid())::text = id::text);

-- ---------------------------------------------------------------------------
-- experiences — private. Owner-only full access, keyed on "userId".
-- ---------------------------------------------------------------------------
alter table public.experiences enable row level security;

drop policy if exists "experiences_owner_select" on public.experiences;
create policy "experiences_owner_select" on public.experiences
  for select using ((select auth.uid())::text = "userId"::text);

drop policy if exists "experiences_owner_insert" on public.experiences;
create policy "experiences_owner_insert" on public.experiences
  for insert with check ((select auth.uid())::text = "userId"::text);

drop policy if exists "experiences_owner_update" on public.experiences;
create policy "experiences_owner_update" on public.experiences
  for update using ((select auth.uid())::text = "userId"::text)
  with check ((select auth.uid())::text = "userId"::text);

drop policy if exists "experiences_owner_delete" on public.experiences;
create policy "experiences_owner_delete" on public.experiences
  for delete using ((select auth.uid())::text = "userId"::text);

-- ---------------------------------------------------------------------------
-- events — public catalog. Anyone may read; any signed-in user may submit.
-- Updates/deletes are intentionally NOT granted to clients — moderation and
-- cleanup run server-side with the service role key.
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;

drop policy if exists "events_public_select" on public.events;
create policy "events_public_select" on public.events
  for select using (true);

drop policy if exists "events_authed_insert" on public.events;
create policy "events_authed_insert" on public.events
  for insert to authenticated with check (true);

-- ---------------------------------------------------------------------------
-- internships — public catalog, read-only for clients. Scrapers write with the
-- service role key (which bypasses RLS).
-- ---------------------------------------------------------------------------
alter table public.internships enable row level security;

drop policy if exists "internships_public_select" on public.internships;
create policy "internships_public_select" on public.internships
  for select using (true);

-- ============================================================================
-- Verify after running (should NOT return the users table's emails):
--   set role anon;
--   select email from public.users limit 1;   -- expect: 0 rows / permission denied
--   reset role;
-- ============================================================================
