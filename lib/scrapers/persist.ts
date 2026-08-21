// Persistence layer for scraped events.
//
// Runs scrapeCerebralValley() + scrapeLuma(), normalizes each row through
// lib/geo/parse.ts so it gets venue/city/region/state/country/lat/lng, then
// upserts into public.events keyed on sourceUrl. Idempotent — running it
// twice in a row inserts nothing the second time.
//
// Why upsert by sourceUrl (not by title+date as the spec suggests):
//   • A title can change ("Test Event" → "AI Mixer") without it being a new
//     row. We want to update the existing record.
//   • A startDate can shift (organizer reschedules) — same row, new date.
//   • sourceUrl is the only field that's truly stable across edits because
//     it's the canonical RSVP link the source assigned at creation time.
//
// title + ISO date is the dedupe key WITHIN a single scrape pass (lib/events/
// source.ts), since CV and Luma sometimes both list the same event. That's
// distinct from the cross-pass identity that matters for DB upsert.

import { createClient as createServiceClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"
import { scrapeCerebralValley, type ScrapedEvent } from "@/lib/scrapers/cerebralvalley"
import { scrapeLuma } from "@/lib/scrapers/luma"
import { parseLocation } from "@/lib/geo/parse"
import { isSpecificEventUrl } from "@/lib/validators/specific-urls"

export interface IngestStats {
  scraped: { cv: number; luma: number; total: number }
  rejected: { nonSpecificUrl: number }
  upserted: number
  failed: number
  errors: string[]
  durationMs: number
}

// Map ScrapedEvent → public.events row shape (matches the existing column
// names used by /api/submit). Geo fields populated via parseLocation().
function toRow(e: ScrapedEvent) {
  const geo = !e.isVirtual && e.location ? parseLocation(e.location) : null
  return {
    title: e.title,
    description: e.description ?? "",
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    isVirtual: e.isVirtual,
    location: e.location ?? null,
    registrationUrl: e.registrationUrl,
    sourceUrl: e.sourceUrl ?? e.registrationUrl,
    imageUrl: e.imageUrl ?? null,
    tags: e.tags ?? [],
    isFree: e.isFree,
    source: e.source,
    status: "APPROVED",
    submittedBy: null,
    // Geo enrichment — same parser /api/submit uses
    venue:   geo?.venue   ?? null,
    city:    geo?.city    ?? null,
    region:  geo?.region  ?? null,
    state:   geo?.state   ?? null,
    country: geo?.country ?? null,
    lat:     geo?.lat     ?? null,
    lng:     geo?.lng     ?? null,
  }
}

// True when the write failed because a column in the payload does not exist.
//
// Two different wordings have to be matched. Postgres itself says
//   column "city" of relation "events" does not exist
// but PostgREST rejects unknown columns from its own schema cache *before*
// the statement ever reaches Postgres, and words it completely differently:
//   PGRST204  Could not find the 'city' column of 'events' in the schema cache
// Only matching the Postgres wording meant this fallback never fired against a
// real Supabase project — see supabase/migrations/20260820_add_event_geo_columns.sql.
function isUnknownColumnError(e: { code?: string; message?: string } | null): boolean {
  if (!e) return false
  if (e.code === "PGRST204") return true
  const m = e.message ?? ""
  return /column .* does not exist/i.test(m) || /could not find the .* column/i.test(m)
}

const GEO_KEYS = ["venue", "city", "region", "state", "country", "lat", "lng"]

export async function ingestScrapedEvents(): Promise<IngestStats> {
  const startedAt = Date.now()
  const stats: IngestStats = {
    scraped: { cv: 0, luma: 0, total: 0 },
    rejected: { nonSpecificUrl: 0 },
    upserted: 0,
    failed: 0,
    errors: [],
    durationMs: 0,
  }

  // 1. Scrape in parallel, tolerate one side failing
  const [cvResult, luResult] = await Promise.allSettled([
    scrapeCerebralValley(),
    scrapeLuma("networking tech startup"),
  ])
  const cv   = cvResult.status === "fulfilled" ? cvResult.value : []
  const luma = luResult.status === "fulfilled" ? luResult.value : []
  stats.scraped.cv   = cv.length
  stats.scraped.luma = luma.length
  stats.scraped.total = cv.length + luma.length

  // 2. Filter to specific event URLs only — keeps discovery / homepage URLs
  //    out of the persistence layer
  const candidates = [...cv, ...luma].filter((e) => {
    if (isSpecificEventUrl(e.registrationUrl)) return true
    stats.rejected.nonSpecificUrl++
    return false
  })

  // 3. Build service-role client — needed to bypass RLS for scraper writes.
  //    User identity is N/A here; rows have submittedBy: null.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY
  const supabase = createServiceClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
  })

  // 4. Upsert in batches of 50 — Postgres can handle larger but small
  //    batches keep each function invocation under Vercel's 30s budget.
  const rows = candidates.map(toRow)
  const BATCH = 50
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    let result = await supabase
      .from("events")
      .upsert(batch, { onConflict: "sourceUrl", ignoreDuplicates: false })

    // Graceful fallback if geo columns aren't migrated yet
    if (result.error && isUnknownColumnError(result.error)) {
      const slim = batch.map((r) => {
        const out: Record<string, unknown> = { ...r }
        for (const k of GEO_KEYS) delete out[k]
        return out
      })
      result = await supabase
        .from("events")
        .upsert(slim, { onConflict: "sourceUrl", ignoreDuplicates: false })
    }

    if (result.error) {
      stats.failed += batch.length
      stats.errors.push(`batch ${i}-${i + batch.length}: ${result.error.message}`)
      // Don't break — try remaining batches anyway
    } else {
      stats.upserted += batch.length
    }
  }

  stats.durationMs = Date.now() - startedAt
  return stats
}
