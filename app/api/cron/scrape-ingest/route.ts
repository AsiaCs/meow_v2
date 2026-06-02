// Hourly cron: scrape CV + Luma, upsert into public.events.
//
// Secured by CRON_SECRET — Vercel sends Authorization: Bearer ${CRON_SECRET}
// on every cron invocation.
//
// Idempotent: running twice in 30s upserts zero new rows the second time
// (sourceUrl is the conflict key).

import { NextResponse } from "next/server"
import { ingestScrapedEvents } from "@/lib/scrapers/persist"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return req.headers.get("authorization") === `Bearer ${expected}`
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  try {
    const stats = await ingestScrapedEvents()
    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    )
  }
}

// Manual trigger from a CI script / curl — same auth
export async function POST(req: Request) { return GET(req) }
