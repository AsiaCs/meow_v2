import { NextResponse } from "next/server"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"
import { parseLocation } from "@/lib/geo/parse"

// ---- Schema ----------------------------------------------------------------

const isoOrDateOnly = z.string().refine(
  (s) => /^\d{4}-\d{2}-\d{2}(T.+)?$/.test(s) && !isNaN(new Date(s).getTime()),
  "Date must be YYYY-MM-DD or full ISO 8601",
)

const optionalUrl = z.string().url("Must be a valid URL").optional().or(z.literal(""))

const submitEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  startDate: isoOrDateOnly,
  endDate: isoOrDateOnly.optional(),
  isVirtual: z.boolean(),
  location: z.string().max(200).optional().or(z.literal("")),
  virtualLink: optionalUrl,
  registrationUrl: z.string().url("Must be a valid URL"),
  tags: z.array(z.string()).min(1, "Pick at least one interest").max(5, "Max 5 interests"),
  isFree: z.boolean(),
  imageUrl: optionalUrl,
})

function toIso(d: string): string {
  if (d.includes("T")) return new Date(d).toISOString()
  return new Date(`${d}T00:00:00`).toISOString()
}

// ---- Progressive insert with detailed error surfacing ----------------------

interface PgErrorLike {
  code?: string         // Postgres SQLSTATE, e.g. "23502" NOT NULL, "42501" RLS, "42703" undefined column
  message?: string
  details?: string
  hint?: string
}

// Strip the candidate columns from the row. Used by the fallback ladder when
// a NOT NULL or undefined-column error rolls in.
function strip<T extends Record<string, unknown>>(row: T, keys: string[]): T {
  const out = { ...row }
  for (const k of keys) delete out[k]
  return out
}

const GEO_KEYS = ["venue", "city", "region", "state", "country", "lat", "lng"]
const META_KEYS = ["status", "source", "submittedBy"]

function isUndefinedColumn(e: PgErrorLike | null | undefined, name?: string): boolean {
  if (!e) return false
  if (e.code === "42703") return true
  if (!e.message) return false
  if (name) return new RegExp(`column .*${name}.* does not exist`, "i").test(e.message)
  return /column .* does not exist/i.test(e.message)
}

function isNotNullViolation(e: PgErrorLike | null | undefined): boolean {
  if (!e) return false
  if (e.code === "23502") return true
  return !!e.message && /null value in column .* violates not-null/i.test(e.message)
}

function isRlsBlocked(e: PgErrorLike | null | undefined): boolean {
  if (!e) return false
  if (e.code === "42501") return true
  return !!e.message && /(row-level security|permission denied for table)/i.test(e.message)
}

// Try to extract the column name out of a Postgres NOT NULL / undefined-column message.
function extractColumnFromError(e: PgErrorLike | null | undefined): string | null {
  if (!e?.message) return null
  const undef = /column "?([\w_]+)"? .*does not exist/i.exec(e.message)
  if (undef) return undef[1]
  const nnl = /null value in column "?([\w_]+)"?/i.exec(e.message)
  if (nnl) return nnl[1]
  return null
}

// ---- Route -----------------------------------------------------------------

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = submitEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    )
  }
  const d = parsed.data

  // Geo enrichment — same parser the Luma + CV scrapers use.
  const geo = !d.isVirtual && d.location ? parseLocation(d.location) : null

  const fullRow: Record<string, unknown> = {
    title: d.title,
    description: d.description || "",
    startDate: toIso(d.startDate),
    endDate: d.endDate ? toIso(d.endDate) : null,
    isVirtual: d.isVirtual,
    location: d.location || null,
    virtualLink: d.virtualLink || null,
    registrationUrl: d.registrationUrl,
    tags: d.tags,
    isFree: d.isFree,
    imageUrl: d.imageUrl || null,
    source: "user",
    status: "PENDING",
    submittedBy: user.id,
    venue: geo?.venue ?? null,
    city: geo?.city ?? null,
    region: geo?.region ?? null,
    state: geo?.state ?? null,
    country: geo?.country ?? null,
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
  }

  // Ladder of progressive fallbacks. Each rung handles a specific failure
  // mode that we've actually seen against Supabase setups in the wild:
  //   1. Full row, with geo + status + submittedBy
  //   2. Drop geo columns        → handles 42703 / "column does not exist"
  //   3. Also drop status/source → handles enum-cast + status-NOT-NULL trips
  //   4. Drop submittedBy        → handles "column submittedBy does not exist"
  //                                or "null value in column submitted_by"
  //   5. Minimum-viable row      → only title, dates, RSVP, tags
  //
  // Every rung surfaces the exact PG error to the client if it fails, so
  // we never go back to the opaque "Failed to submit event" banner.
  const attempts: Array<{ label: string; row: Record<string, unknown> }> = [
    { label: "full",            row: fullRow },
    { label: "no-geo",          row: strip(fullRow, GEO_KEYS) },
    { label: "no-geo-no-meta",  row: strip(fullRow, [...GEO_KEYS, "status", "source"]) },
    { label: "no-submittedBy",  row: strip(fullRow, [...GEO_KEYS, "submittedBy"]) },
    {
      label: "minimum-viable",
      row: {
        title: d.title,
        description: d.description || "",
        startDate: toIso(d.startDate),
        endDate: d.endDate ? toIso(d.endDate) : null,
        isVirtual: d.isVirtual,
        location: d.location || null,
        registrationUrl: d.registrationUrl,
        tags: d.tags,
        isFree: d.isFree,
        imageUrl: d.imageUrl || null,
      },
    },
  ]

  let lastErr: PgErrorLike | null = null
  let attemptIdx = 0

  for (const { label, row } of attempts) {
    attemptIdx++
    try {
      const r = await supabase.from("events").insert(row).select().single()
      if (!r.error) {
        return NextResponse.json(
          { ok: true, attempt: label, data: r.data },
          { status: 201 },
        )
      }
      lastErr = r.error as PgErrorLike

      // Decide whether to escalate to the next rung or bail.
      const offendingCol = extractColumnFromError(lastErr)
      const isFixableHere =
        isUndefinedColumn(lastErr) ||
        // NOT NULL on a meta column means we should try without it on the next rung
        (isNotNullViolation(lastErr) &&
          !!offendingCol &&
          [...META_KEYS, ...GEO_KEYS, "submittedBy", "submitted_by"].includes(offendingCol))

      if (!isFixableHere) break  // RLS, FK, enum cast — no fallback rung will help
    } catch (thrown) {
      // Network / runtime — capture for the response
      lastErr = {
        code: undefined,
        message: thrown instanceof Error ? thrown.message : "unknown runtime error",
      }
      break
    }
  }

  // Every rung failed. Tell the client exactly why, so the user (and future-me)
  // doesn't have to guess. Maps a handful of common Postgres SQLSTATEs to a
  // human-readable hint while still returning the raw code + message.
  let hint = "Insert rejected by the database."
  if (lastErr) {
    if (isRlsBlocked(lastErr)) {
      hint = "Row-level security blocked the insert. Add an INSERT policy on public.events allowing auth.uid() = submittedBy."
    } else if (isNotNullViolation(lastErr)) {
      const col = extractColumnFromError(lastErr) ?? "a required column"
      hint = `${col} is NOT NULL — make it nullable or have the form send a value.`
    } else if (isUndefinedColumn(lastErr)) {
      const col = extractColumnFromError(lastErr) ?? "a column"
      hint = `${col} does not exist on public.events — add the column or remove it from the insert.`
    } else if (lastErr.code === "22P02") {
      hint = "Invalid input syntax for an enum or numeric — check status / source casing."
    } else if (lastErr.code === "23503") {
      hint = "Foreign-key violation — submittedBy references a user that doesn't exist."
    }
  }

  console.error("[submit/POST] insert failed", {
    attempts: attemptIdx,
    code: lastErr?.code,
    message: lastErr?.message,
    details: lastErr?.details,
    hint: lastErr?.hint,
  })

  return NextResponse.json(
    {
      error: "Failed to submit event",
      attempt: attempts[attemptIdx - 1]?.label,
      attempts: attemptIdx,
      db: {
        code: lastErr?.code ?? null,
        message: lastErr?.message ?? null,
        details: lastErr?.details ?? null,
        hint: lastErr?.hint ?? null,
      },
      hint,
    },
    { status: 500 },
  )
}
