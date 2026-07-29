-- ============================================================================
-- Fix: "Could not find the 'githubUrl' column of 'users' in the schema cache"
--
-- The profile page and /api/profile read & write githubUrl / portfolioUrl on
-- public.users, but those columns were never added. Add them (nullable text,
-- matching the existing linkedinUrl column style). Idempotent.
--
-- Run in: Supabase Dashboard -> SQL Editor -> + New query -> paste -> Run.
-- ============================================================================

alter table public.users
  add column if not exists "githubUrl"    text,
  add column if not exists "portfolioUrl" text;

-- Force PostgREST to refresh its schema cache so the new columns are usable
-- immediately (Supabase usually does this automatically, but this guarantees it).
notify pgrst, 'reload schema';
