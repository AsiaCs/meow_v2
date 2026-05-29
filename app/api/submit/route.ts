import { NextResponse } from "next/server"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"
import { parseLocation } from "@/lib/geo/parse"

// ---- Schema ----
//
// Notes on what changed and why:
// - startDate accepts both ISO 8601 ("2026-05-27T18:00:00Z") AND date-only
//   ("2026-05-27"). The submit form's <input type="date"> emits date-only,
//   and a strict .datetime() blew up every submission.
// - All URL fields accept empty string as "omitted". When the user leaves
//   `Image URL (optional)` blank the form sends `""`, which used to fail
//   .url() validation and surfaced as the dreaded "Validation failed" red
//   warning. .url().optional().or(z.literal("")) handles both shapes.
// - tags capped at 1..5 — matches the form's UX.

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

// Normalize a date-only string to a startOfDay ISO so Postgres timestamptz
// doesn't choke on bare YYYY-MM-DD.
function toIso(d: string): string {
  if (d.includes("T")) return new Date(d).toISOString()
  return new Date(`${d}T00:00:00`).toISOString()
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const result = submitEventSchema.safeParse(body)
    if (!result.success) {
      // Return both a top-level error and the structured issues array so the
      // form can show field-level red text instead of a generic banner.
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: result.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      )
    }

    const d = result.data

    // Enrich the location string into a geo-ready object: venue, city, region,
    // state, country, lat, lng. Hands off to the same parser the scrapers use,
    // so user-submitted events are searchable by city / radius the same way
    // Luma / Cerebral Valley events are.
    const parsed = !d.isVirtual && d.location ? parseLocation(d.location) : null

    const insertRow: Record<string, unknown> = {
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
      // Geo fields (nullable columns; INSERT degrades if they don't exist).
      venue: parsed?.venue ?? null,
      city: parsed?.city ?? null,
      region: parsed?.region ?? null,
      state: parsed?.state ?? null,
      country: parsed?.country ?? null,
      lat: parsed?.lat ?? null,
      lng: parsed?.lng ?? null,
    }

    let insertResult = await supabase
      .from("events")
      .insert(insertRow)
      .select()
      .single()

    // If geo columns aren't migrated yet, retry without them.
    if (insertResult.error && /column .* does not exist/i.test(insertResult.error.message ?? "")) {
      const slimRow = { ...insertRow }
      for (const k of ["venue", "city", "region", "state", "country", "lat", "lng"]) {
        delete slimRow[k]
      }
      insertResult = await supabase
        .from("events")
        .insert(slimRow)
        .select()
        .single()
    }

    if (insertResult.error) throw insertResult.error
    return NextResponse.json(insertResult.data, { status: 201 })
  } catch (error) {
    console.error("[submit/POST]", error)
    return NextResponse.json({ error: "Failed to submit event" }, { status: 500 })
  }
}
