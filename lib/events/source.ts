// Single source of truth for "what events do we have right now."
// Both the listing route (/api/events) and the detail page (/events/[id])
// import this function so they see the exact same event set, which means
// the hash ID a card was rendered with always resolves on the detail page.

import { unstable_cache } from "next/cache"
import { scrapeCerebralValley, type ScrapedEvent } from "@/lib/scrapers/cerebralvalley"
import { scrapeLuma } from "@/lib/scrapers/luma"
import { filterReachable } from "@/lib/validators/links"
import { isSpecificEventUrl } from "@/lib/validators/specific-urls"

export type { ScrapedEvent }

export function stableEventId(url: string): string {
  let h = 0
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) - h) + url.charCodeAt(i)
    h |= 0
  }
  return `ev-${Math.abs(h).toString(36)}`
}

// Bump the version suffix to invalidate the shared cache when scraper output
// shape changes. Both routes import this function so they share the entry.
const CACHE_KEY = "events-shared-v1"
const CACHE_TTL_SECONDS = 1800

export const getEventsForLocation = unstable_cache(
  async (city: string | null): Promise<ScrapedEvent[]> => {
    const cityHint = city ?? undefined
    const [cvResult, lumaResult] = await Promise.allSettled([
      scrapeCerebralValley(),
      scrapeLuma("networking tech startup", cityHint),
    ])

    const cv = cvResult.status === "fulfilled" ? cvResult.value : []
    const lu = lumaResult.status === "fulfilled" ? lumaResult.value : []

    // Reject community/discovery URLs — only specific event pages
    const specific = [...cv, ...lu].filter((e) =>
      isSpecificEventUrl(e.registrationUrl),
    )

    // De-dupe by registrationUrl
    const seen = new Set<string>()
    const deduped = specific.filter((e) => {
      if (seen.has(e.registrationUrl)) return false
      seen.add(e.registrationUrl)
      return true
    })

    // Validate URLs are actually reachable
    return await filterReachable(deduped, (e) => e.registrationUrl)
  },
  [CACHE_KEY],
  { revalidate: CACHE_TTL_SECONDS, tags: ["events"] },
)
