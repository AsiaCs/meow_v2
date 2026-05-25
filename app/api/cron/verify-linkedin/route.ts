// Daily LinkedIn verification cron.
//
// Walks every onboarded user with a saved linkedinUrl, runs them through
// the gatekeeper, and writes the result to two columns on public.users:
//
//   linkedinStatus     text       'verified' | 'broken' | 'inconclusive' | 'skipped'
//   linkedinCheckedAt  timestamptz
//
// /api/people then filters out rows with linkedinStatus = 'broken' so the
// dashboard never shows a dead profile.

import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"
import { verifyLinkedInProfile, isWellFormedProfileUrl } from "@/lib/linkedin/verify"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return req.headers.get("authorization") === `Bearer ${expected}`
}

interface UserRow {
  id: string
  linkedinUrl: string | null
  linkedinStatus: string | null
  linkedinCheckedAt: string | null
}

const RECHECK_VERIFIED_AFTER_DAYS = 30 // re-verify previously-verified URLs monthly
const RECHECK_BROKEN_AFTER_DAYS = 7    // re-check broken ones weekly (they might be fixed)

function shouldRecheck(row: UserRow, now: Date): boolean {
  if (!row.linkedinCheckedAt) return true
  const ageDays = (now.getTime() - new Date(row.linkedinCheckedAt).getTime()) / 86_400_000
  if (row.linkedinStatus === "verified") return ageDays > RECHECK_VERIFIED_AFTER_DAYS
  if (row.linkedinStatus === "broken") return ageDays > RECHECK_BROKEN_AFTER_DAYS
  // inconclusive / skipped / null — try again next run
  return true
}

async function run(req: Request, maxToProcess: number) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY
  const supabase = createServiceClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase
    .from("users")
    .select("id, linkedinUrl, linkedinStatus, linkedinCheckedAt")
    .eq("onboarded", true)
    .not("linkedinUrl", "is", null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const rows = (data ?? []) as UserRow[]
  const now = new Date()
  const queue = rows.filter((r) => shouldRecheck(r, now)).slice(0, maxToProcess)

  let verified = 0
  let broken = 0
  let inconclusive = 0
  let skipped = 0
  let writeErrors = 0
  const examples: Array<{ id: string; status: string; url: string; reason?: string }> = []

  // Concurrency 3 — LinkedIn rate-limits hard. Don't go higher.
  const CONC = 3
  for (let i = 0; i < queue.length; i += CONC) {
    const batch = queue.slice(i, i + CONC)
    const results = await Promise.all(
      batch.map(async (row) => {
        const url = row.linkedinUrl
        if (!isWellFormedProfileUrl(url)) {
          return { row, result: { status: "skipped" as const, reason: "malformed", via: "skip" as const } }
        }
        const result = await verifyLinkedInProfile(url)
        return { row, result }
      }),
    )

    for (const { row, result } of results) {
      if (result.status === "verified") verified++
      else if (result.status === "broken") broken++
      else if (result.status === "inconclusive") inconclusive++
      else skipped++

      if (examples.length < 5) {
        examples.push({ id: row.id, status: result.status, url: row.linkedinUrl ?? "", reason: result.reason })
      }

      const upd = await supabase
        .from("users")
        .update({
          linkedinStatus: result.status,
          linkedinCheckedAt: new Date().toISOString(),
        })
        .eq("id", row.id)
      if (upd.error) {
        writeErrors++
        // Most likely cause: columns don't exist yet. We log and continue —
        // the verifier still ran, the result is just not persisted.
        console.error("[verify-linkedin] write failed", upd.error.message)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: rows.length,
    queued: queue.length,
    verified,
    broken,
    inconclusive,
    skipped,
    writeErrors,
    examples,
  })
}

// GET is the Vercel-cron path. POST is for manual runs / on-demand triggers.
export async function GET(req: Request) {
  return run(req, 200)
}
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const max = Number(searchParams.get("max") ?? "50")
  return run(req, Math.min(Math.max(max, 1), 500))
}
