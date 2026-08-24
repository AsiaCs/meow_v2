import LandingNav from "@/components/landing/nav"
import Hero, { type HeroEvent } from "@/components/landing/hero"
import Week, { type WeekDay } from "@/components/landing/week"
import Coverage, { type CityCount } from "@/components/landing/coverage"
import HowItWorks from "@/components/landing/how-it-works"
import Footer from "@/components/landing/footer"
import { fetchListedEvents } from "@/lib/events/listing"
import { isTechRelevant, stripEmoji } from "@/lib/events/relevance"
import { timeZoneFor, formatInZone } from "@/lib/events/timezone"

// The landing page renders real listings, not a staged demo. Events come from
// the same endpoint /events uses, so the marketing surface and the app can
// never disagree about what exists — and if the feed breaks, the hero says so
// rather than hiding it behind decoration.
//
// Dynamic by necessity; the listing endpoint is edge-cached (s-maxage=60), so
// the cost on the hot path is a cache read, not a scrape.
export const revalidate = 60

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

export default async function LandingPage() {
  const all = await fetchListedEvents()
  const now = Date.now()

  const upcoming = all
    .filter((e) => new Date(e.startDate).getTime() > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  // Marketing surface only — /events keeps the full catalogue. See
  // lib/events/relevance.ts for why this filter exists.
  const relevant = upcoming.filter((e) =>
    isTechRelevant({
      title: e.title,
      description: e.description ?? null,
      tags: e.tags ?? null,
    }),
  )

  type Ev = (typeof relevant)[number]
  const idOf = (e: Ev) => (e as { id?: string }).id ?? e.registrationUrl
  const cityOf = (e: Ev) => (e as { city?: string | null }).city ?? null

  // Every date on this page is formatted in the EVENT's timezone, never the
  // server's. Vercel runs UTC, so server-side toLocaleTimeString() rendered a
  // 7:30 PM San Francisco meetup as "2:30 AM · San Francisco" — plausible
  // enough to survive review, and wrong on every single row.
  const zoned = (e: Ev) => {
    const iso = new Date(e.startDate).toISOString()
    return { iso, f: formatInZone(iso, timeZoneFor(cityOf(e), e.location ?? null)) }
  }

  const heroEvents: HeroEvent[] = relevant.slice(0, 7).map((e) => {
    const { iso, f } = zoned(e)
    return {
      id: idOf(e),
      title: stripEmoji(e.title),
      city: cityOf(e),
      startISO: iso,
      weekday: f.weekday,
      month: f.month,
      dayNum: f.dayNum,
      time: f.time,
      source: e.source,
    }
  })

  // ── Group by the event's own calendar day ─────────────────────────────────
  const byDay = new Map<string, WeekDay>()
  for (const e of relevant) {
    const { f } = zoned(e)
    if (!byDay.has(f.dayKey)) {
      byDay.set(f.dayKey, {
        key: f.dayKey,
        weekday: f.weekday,
        dayNum: f.dayNum,
        month: f.month,
        events: [],
      })
    }
    byDay.get(f.dayKey)!.events.push({
      id: idOf(e),
      title: stripEmoji(e.title),
      time: f.time,
      city: cityOf(e),
    })
  }
  const days = [...byDay.values()].slice(0, 7)

  // ── Real city counts ──────────────────────────────────────────────────────
  const counts = new Map<string, number>()
  for (const e of relevant) {
    const c = cityOf(e)
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  const cities: CityCount[] = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([city, count]) => ({ city, slug: slugify(city), count }))

  return (
    <main className="bg-bg-base">
      <LandingNav />
      <Hero events={heroEvents} totalCount={relevant.length} />
      <Week days={days} />
      <Coverage cities={cities} totalCount={relevant.length} />
      <HowItWorks />
      <Footer />
    </main>
  )
}
