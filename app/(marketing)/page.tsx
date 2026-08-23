import LandingNav from "@/components/landing/nav"
import Hero, { type HeroEvent } from "@/components/landing/hero"
import Week, { type WeekDay } from "@/components/landing/week"
import Coverage, { type CityCount } from "@/components/landing/coverage"
import HowItWorks from "@/components/landing/how-it-works"
import Footer from "@/components/landing/footer"
import { fetchListedEvents } from "@/lib/events/listing"
import { isTechRelevant, stripEmoji } from "@/lib/events/relevance"

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

  const idOf = (e: (typeof relevant)[number]) =>
    (e as { id?: string }).id ?? e.registrationUrl
  const cityOf = (e: (typeof relevant)[number]) =>
    (e as { city?: string | null }).city ?? null

  const heroEvents: HeroEvent[] = relevant.slice(0, 7).map((e) => ({
    id: idOf(e),
    title: stripEmoji(e.title),
    city: cityOf(e),
    startISO: new Date(e.startDate).toISOString(),
    source: e.source,
  }))

  // ── Group the next seven days that actually have something in them ────────
  const byDay = new Map<string, WeekDay>()
  for (const e of relevant) {
    const d = new Date(e.startDate)
    // Key on the LOCAL date, because the labels below are local. Keying on
    // toISOString() (UTC) split a single local day across two columns —
    // "24 MON AUG" rendered twice — for any event late enough in the evening
    // to fall on the next UTC day.
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`
    if (!byDay.has(key)) {
      byDay.set(key, {
        key,
        weekday: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
        dayNum: String(d.getDate()).padStart(2, "0"),
        month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        events: [],
      })
    }
    byDay.get(key)!.events.push({
      id: idOf(e),
      title: stripEmoji(e.title),
      time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
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
