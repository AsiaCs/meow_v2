import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { scrapeCerebralValley, type ScrapedEvent } from "@/lib/scrapers/cerebralvalley"
import { scrapeLuma } from "@/lib/scrapers/luma"
import { filterReachable, isLinkReachable } from "@/lib/validators/links"
import { isSpecificEventUrl } from "@/lib/validators/specific-urls"

export const runtime = "nodejs"
export const maxDuration = 30
export const revalidate = 1800

function stableId(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return `ev-${Math.abs(h).toString(36)}`
}

const fetchLiveEvents = unstable_cache(
  async (city: string | null): Promise<ScrapedEvent[]> => {
    const cityHint = city ?? undefined
    const [cvResult, lumaResult] = await Promise.allSettled([
      scrapeCerebralValley(),
      scrapeLuma("networking tech startup", cityHint),
    ])

    const cvEvents = cvResult.status === "fulfilled" ? cvResult.value : []
    const lumaEvents = lumaResult.status === "fulfilled" ? lumaResult.value : []

    // Drop community/discovery URLs — we only want specific event pages
    const specific = [...cvEvents, ...lumaEvents].filter((e) =>
      isSpecificEventUrl(e.registrationUrl),
    )

    // De-dupe by registrationUrl
    const seenUrls = new Set<string>()
    const deduped = specific.filter((e) => {
      if (seenUrls.has(e.registrationUrl)) return false
      seenUrls.add(e.registrationUrl)
      return true
    })

    // Validate every URL is actually reachable
    return await filterReachable(deduped, (e) => e.registrationUrl)
  },
  ["events-live-v2"],
  { revalidate: 1800, tags: ["events"] },
)

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

    // Get the user's saved location to bias Luma scraping toward their city
    let userCity: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("location")
          .eq("id", user.id)
          .single()
        userCity = (data as any)?.location ?? null
      }
    } catch { /* anonymous viewers still get events */ }

    let events = await fetchLiveEvents(userCity)

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
        const dbSpecific = (dbEvents as any[]).filter((e) => isSpecificEventUrl(e.registrationUrl))
        const validDb = await filterReachable(dbSpecific, (e) => e.registrationUrl)
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

    // Shape for client (stable IDs from URL)
    const shaped = events.map((e) => ({
      id: stableId(e.registrationUrl),
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
