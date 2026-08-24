import { headers } from "next/headers"
import type { ScrapedEvent } from "@/lib/events/source"

// Fetch the exact event payload /events renders.
//
// WHY THIS EXISTS: getAllEvents() in lib/events/source.ts is an
// unstable_cache instance, and per the Next 16 docs the cache key is derived
// from "the arguments and the stringified version of your function". Next
// bundles pages separately from route handlers, so each consumer of
// getAllEvents() ends up with its OWN fill of that cache, populated at a
// different moment from a live scrape whose result set changes.
//
// Measured in production on 2026-08-20:
//   /api/events (route handler) ... 46 events
//   /events/[id] (page) .......... a fill missing 9 of them -> 404s
//   /dashboard  (page) ........... a fill so stale that only 1 future event
//                                  survived the `startDate > now` filter,
//                                  against 46 in the listing
//
// Every server component that needs the event list should call this rather
// than getAllEvents() directly, so there is exactly one fill and the pages
// cannot disagree about which events exist. The endpoint is edge-cached
// (s-maxage=60), so this is not a real round trip in production.
export async function fetchListedEvents(): Promise<ScrapedEvent[]> {
  try {
    const h = await headers()
    const host = h.get("x-forwarded-host") ?? h.get("host")
    if (!host) return fallbackToDirect()
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")

    // Vercel's deployment protection sits at the edge, so a deployment
    // fetching its OWN api route is intercepted too: on a protected preview
    // this returns a 302 to the SSO login rather than JSON, and the landing
    // page renders empty. Observed on preview meow-21dieuj4n. The bypass
    // header is the documented escape hatch; it is only present when
    // Protection Bypass for Automation is enabled, hence the fallback below.
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    const res = await fetch(`${proto}://${host}/api/events`, {
      next: { revalidate: 60 },
      redirect: "manual",
      headers: bypass ? { "x-vercel-protection-bypass": bypass } : undefined,
    })

    // A redirect here means something intercepted us (auth wall, protection,
    // WAF) — not that there are no events.
    if (res.status >= 300 && res.status < 400) return fallbackToDirect()
    if (!res.ok) return fallbackToDirect()

    const listed = (await res.json()) as Array<Record<string, unknown>>
    if (!Array.isArray(listed)) return fallbackToDirect()

    return listed.map(toScrapedEvent)
  } catch {
    return fallbackToDirect()
  }
}

// Last resort: read the scrape cache in-process.
//
// This is the path the split-cache problem lives on — each bundle gets its own
// unstable_cache fill, which is why the HTTP route is preferred. But showing
// a page with slightly different events beats showing a page with none, so
// when the endpoint is unreachable we take the inconsistency over the blank.
async function fallbackToDirect(): Promise<ScrapedEvent[]> {
  try {
    const { getAllEvents } = await import("@/lib/events/source")
    return await getAllEvents()
  } catch {
    return []
  }
}

// The listing endpoint serialises dates to ISO strings; callers expect Dates.
export function toScrapedEvent(raw: Record<string, unknown>): ScrapedEvent {
  return {
    ...raw,
    startDate: new Date(raw.startDate as string),
    endDate: raw.endDate ? new Date(raw.endDate as string) : undefined,
    sourceUrl: raw.registrationUrl as string,
    description: (raw.description as string | null) ?? undefined,
    location: (raw.location as string | null) ?? undefined,
    imageUrl: (raw.imageUrl as string | null) ?? undefined,
  } as unknown as ScrapedEvent
}
