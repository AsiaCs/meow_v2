import LandingNav from "@/components/landing/nav"
import Hero, { type HeroEvent } from "@/components/landing/hero"
import Footer from "@/components/landing/footer"
import { fetchListedEvents } from "@/lib/events/listing"

// The landing page renders real listings, not a staged demo. Events come from
// the same endpoint /events uses, so the hero index and the app can never
// disagree about what exists — and if the feed breaks, the hero shows an
// honest empty state rather than hiding it behind decoration.
//
// This makes the route dynamic. The listing endpoint is edge-cached
// (s-maxage=60), so the cost is a cache read, not a scrape, on the hot path.
export const revalidate = 60

export default async function LandingPage() {
  const all = await fetchListedEvents()

  const now = Date.now()
  const upcoming = all
    .filter((e) => new Date(e.startDate).getTime() > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  const events: HeroEvent[] = upcoming.slice(0, 7).map((e) => ({
    id: (e as { id?: string }).id ?? e.registrationUrl,
    title: e.title,
    city: (e as { city?: string | null }).city ?? null,
    startISO: new Date(e.startDate).toISOString(),
    source: e.source,
  }))

  return (
    <main className="bg-bg-base">
      <LandingNav />
      <Hero events={events} totalCount={upcoming.length} />
      <Footer />
    </main>
  )
}
