-- ============================================================================
-- Add the geo-enrichment columns to public.events.
--
-- WHY: both lib/scrapers/persist.ts (toRow) and app/api/submit/route.ts build
-- rows containing venue/city/region/state/country/lat/lng from
-- lib/geo/parse.ts, but those columns were never added to the table. Every
-- scraper upsert has therefore been rejected by PostgREST with:
--
--   PGRST204  Could not find the 'city' column of 'events' in the schema cache
--
-- persist.ts has a slim-retry fallback for exactly this case, but it was
-- guarded by /column .* does not exist/i — the *Postgres* wording, not
-- PostgREST's — so it never fired. The cron kept returning HTTP 200 {ok:true}
-- while writing nothing: the newest source='meow' event is 2026-05-19, which
-- predates the ingest cron itself (added 2026-06-02). /api/submit survived
-- only because it has a separate column-stripping fallback ladder.
--
-- The regex is fixed in the same change; this migration removes the need for
-- the fallback to fire at all and restores the geo enrichment that the
-- /events city pages and match scoring expect.
--
-- Types mirror lib/geo/parse.ts: the five text fields are nullable strings,
-- lat/lng are nullable doubles (null for virtual events or unmatched cities).
--
-- Run in: Supabase Dashboard -> SQL Editor -> + New query -> paste -> Run.
-- Idempotent: safe to run more than once.
-- ============================================================================

alter table public.events add column if not exists venue   text;
alter table public.events add column if not exists city    text;
alter table public.events add column if not exists region  text;
alter table public.events add column if not exists state   text;
alter table public.events add column if not exists country text;
alter table public.events add column if not exists lat     double precision;
alter table public.events add column if not exists lng     double precision;

-- The /events/city/[slug] route filters on city, and the dashboard feed
-- filters on region — both are read on nearly every page load.
create index if not exists events_city_idx   on public.events (city);
create index if not exists events_region_idx on public.events (region);

-- ============================================================================
-- Verify after running (all seven should come back, no error):
--   select venue, city, region, state, country, lat, lng
--   from public.events limit 1;
--
-- PostgREST caches the schema; if the API still 400s on these columns after
-- running this, reload the cache with:
--   notify pgrst, 'reload schema';
-- ============================================================================

notify pgrst, 'reload schema';
