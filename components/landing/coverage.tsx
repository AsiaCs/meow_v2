import Link from "next/link"

// ── Coverage ────────────────────────────────────────────────────────────────
//
// Where a landing page would normally put a logo wall or fabricated
// testimonials, this puts verifiable numbers: the cities meow actually has
// listings in right now, with real counts, generated at request time.
//
// It is a typographic list, not a card grid — nothing here needs a box around
// it, and boxing it would only add the uniform rounded-rectangle texture the
// rebuild is trying to get rid of.
//
// If a city drops out of the feed it disappears from this list. That is the
// intended behaviour: the section can only ever claim what is true.

export type CityCount = { city: string; slug: string; count: number }

export default function Coverage({
  cities,
  totalCount,
}: {
  cities: CityCount[]
  totalCount: number
}) {
  if (cities.length === 0) return null

  return (
    <section className="border-b border-border-subtle">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <h2 className="font-display text-heading-m text-text-primary">
              Coverage
            </h2>
            <p className="mt-6 max-w-[34ch] text-lead text-text-secondary">
              {totalCount} listings across {cities.length}{" "}
              {cities.length === 1 ? "city" : "cities"}, counted live. No city is
              listed here until it has something in it.
            </p>
          </div>

          <ul className="lg:col-span-8">
            {cities.map((c) => (
              <li key={c.slug} className="border-t border-border-subtle last:border-b">
                <Link
                  href={`/events/city/${c.slug}`}
                  className="group flex items-baseline justify-between gap-6 py-5"
                >
                  <span className="font-display text-heading-l text-text-primary transition-colors duration-200 group-hover:text-accent">
                    {c.city}
                  </span>
                  <span className="text-meta tabular-nums text-text-muted">
                    {String(c.count).padStart(2, "0")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
