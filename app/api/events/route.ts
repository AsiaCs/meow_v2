import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAllEvents, stableEventId, type ScrapedEvent } from "@/lib/events/source"
import { filterReachable, isLinkReachable } from "@/lib/validators/links"
import { isSpecificEventUrl } from "@/lib/validators/specific-urls"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30
export const revalidate = 1800

type DbEventRow = {
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  isVirtual: boolean
  registrationUrl: string
  imageUrl: string | null
  tags: string[]
  source: string
  isFree: boolean
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get("tags")
    const virtualParam = searchParams.get("virtual")
    const freeParam = searchParams.get("free")
    const dateParam = searchParams.get("date")
    const filterTags = tagsParam
      ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
      : []

    // City-agnostic shared cache. Client does the city sort/filter UI-side.
    let events = await getAllEvents()

    // Pull DB events too, validate their URLs the same way
    try {
      const supabase = await createClient()
      const { data: dbEvents } = await supabase
        .from("events")
        .select("title, description, startDate, endDate, location, isVirtual, registrationUrl, imageUrl, tags, source, isFree")
        .eq("status", "APPROVED")
        .gte("startDate", new Date().toISOString())
        .order("startDate")
      if (Array.isArray(dbEvents) && dbEvents.length > 0) {
        // isSpecificEventUrl is a strict whitelist of lu.ma/eventbrite/meetup/CV/
        // partiful slug shapes — it was meant to gate noisy SCRAPER output. It
        // should never police real user submissions, where the user picked the
        // URL themselves. Skip it for source === "user".
        const dbSpecific = (dbEvents as DbEventRow[]).filter(
          (e) => e.source === "user" || isSpecificEventUrl(e.registrationUrl),
        )
        // Same logic for reachability: don't HEAD-check user-supplied URLs.
        // The user is on the hook for their own link.
        const userRows  = dbSpecific.filter((e) => e.source === "user")
        const otherRows = dbSpecific.filter((e) => e.source !== "user")
        const validOther = await filterReachable(otherRows, (e) => e.registrationUrl)
        const validDb = [...userRows, ...validOther]

        const seenUrls = new Set(events.map((e) => e.registrationUrl))
        for (const e of validDb) {
          if (!seenUrls.has(e.registrationUrl)) {
            events.push({
              ...e,
              startDate: new Date(e.startDate),
              endDate: e.endDate ? new Date(e.endDate) : undefined,
              sourceUrl: e.registrationUrl,
            } as ScrapedEvent)
          }
        }
      }
    } catch { /* skip DB on error */ }

    // Only future events
    const now = new Date()
    events = events.filter((e) => new Date(e.startDate) > now)

    // Filters
    if (filterTags.length > 0) {
      events = events.filter((e) =>
        filterTags.some((ft) =>
          (e.tags ?? []).some((t) => t.toLowerCase().includes(ft.toLowerCase())),
        ),
      )
    }
    if (virtualParam === "true") events = events.filter((e) => e.isVirtual)
    if (freeParam === "true") events = events.filter((e) => e.isFree)
    if (dateParam) {
      const target = new Date(dateParam)
      if (!isNaN(target.getTime())) {
        events = events.filter((e) => {
          const d = new Date(e.startDate)
          return (
            d.getFullYear() === target.getFullYear() &&
            d.getMonth() === target.getMonth() &&
            d.getDate() === target.getDate()
          )
        })
      }
    }

    // Sort ascending by date
    events.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )

    // Shape for client (stable IDs from URL) — now includes structured geo
    const shaped = events.map((e) => ({
      id: stableEventId(e.registrationUrl),
      title: e.title,
      description: e.description ?? null,
      startDate: new Date(e.startDate).toISOString(),
      endDate: e.endDate ? new Date(e.endDate).toISOString() : null,
      location: e.location ?? null,
      isVirtual: e.isVirtual,
      registrationUrl: e.registrationUrl,
      imageUrl: e.imageUrl ?? null,
      tags: e.tags ?? [],
      isFree: e.isFree,
      source: e.source,
      // Structured location (populated by lib/geo/parse.ts in the shared cache)
      venue:   e.venue   ?? null,
      city:    e.city    ?? null,
      region:  e.region  ?? null,
      state:   e.state   ?? null,
      country: e.country ?? null,
      lat:     e.lat     ?? null,
      lng:     e.lng     ?? null,
    }))

    return NextResponse.json(shaped)
  } catch (error) {
    console.error("[events/GET]", error)
    return NextResponse.json([])
  }
}

// Lazy escape-hatch verifier endpoint — useful for debugging individual URLs
export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    if (typeof url !== "string") return NextResponse.json({ ok: false })
    const ok = await isLinkReachable(url)
    return NextResponse.json({ ok, specific: isSpecificEventUrl(url) })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
