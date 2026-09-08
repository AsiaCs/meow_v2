import Link from "next/link"

// ── Hero ────────────────────────────────────────────────────────────────────
//
// Built to the reference screenshot: generous top whitespace, a left-aligned
// two-line headline at a restrained scale, a muted evenly-spaced trust row,
// then the product visual inside a dark rounded frame over a soft pastel
// backdrop.
//
// Two deliberate adaptations, because copying the reference literally would
// have meant shipping something untrue:
//
//   The trust row in the reference is a wall of customer logos. meow has no
//   customers to show, and inventing them is fabricated social proof. The row
//   carries live city counts instead: same slot, same visual weight, same job
//   of proving the thing is real, except it is actually true and it changes
//   when the feed does.
//
//   The framed visual in the reference is a product screenshot. This renders
//   the REAL index instead. meow's product is the listing, so a screenshot of
//   it would be a picture of something we can simply show.
//
// Server component. The entrance reveal is CSS, so the content is in the HTML
// and visible without hydration.

export type HeroEvent = {
  id: string
  title: string
  city: string | null
  startISO: string
  weekday: string
  month: string
  dayNum: string
  time: string
  source: string
}

export type HeroCity = { city: string; slug: string; count: number }

export default function Hero({
  events,
  totalCount,
  cities,
}: {
  events: HeroEvent[]
  totalCount: number
  cities: HeroCity[]
}) {
  return (
    <section className="px-4 pt-20 sm:px-6 sm:pt-28">
      <div className="mx-auto w-full max-w-[1180px]">
        {/* ── Statement ──────────────────────────────────────────────── */}
        <h1
          className="enter max-w-[18ch] text-display text-text-primary"
          style={{ "--i": 0 } as React.CSSProperties}
        >
          Every AI event and internship, in one index.
        </h1>

        <p
          className="enter mt-6 max-w-[52ch] text-lead text-text-secondary"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          Talks, hackathons and mixers pulled from Luma and Cerebral Valley,
          alongside open roles. Filtered to your city, sorted by what happens next.
        </p>

        {/* ── Trust row ──────────────────────────────────────────────────
            Real counts, not logos. Plain on the ground, no cards, no borders. */}
        {cities.length > 0 && (
          <ul
            className="enter mt-14 flex flex-wrap items-center gap-x-10 gap-y-4 sm:gap-x-14"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            {cities.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/events/city/${c.slug}`}
                  className="text-ui text-text-muted transition-colors hover:text-text-primary"
                >
                  <span className="tabular-nums font-medium text-text-secondary">{c.count}</span>
                  {" in "}
                  {c.city}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Product visual ───────────────────────────────────────────────
          Dark frame, pastel backdrop, real listings inside the window. The
          gradient is decorative backdrop art behind a product shot, which is
          the one context this system allows one. */}
      <div
        className="enter mx-auto mt-16 w-full max-w-[1180px]"
        style={{ "--i": 3 } as React.CSSProperties}
      >
        <div className="rounded-frame bg-bg-inverse p-2 sm:p-2.5">
          <div className="hero-backdrop overflow-hidden rounded-panel px-4 pt-10 sm:px-12 sm:pt-14">
            <div className="mx-auto w-full max-w-[880px] overflow-hidden rounded-t-panel border border-border-subtle border-b-0 bg-bg-base shadow-panel">
              <div className="flex items-baseline justify-between gap-4 border-b border-border-subtle px-5 py-4">
                <h2 className="text-ui font-medium text-text-primary">Next up</h2>
                <span className="text-meta tabular-nums text-text-muted">
                  {events.length} of {totalCount}
                </span>
              </div>

              {events.length > 0 ? (
                <ul>
                  {events.map((e, i) => (
                    <li
                      key={e.id}
                      className="enter-row border-b border-border-subtle last:border-b-0"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <Link
                        href={`/events/${e.id}`}
                        className="group grid grid-cols-[auto_1fr] items-baseline gap-x-4 px-5 py-3.5 sm:grid-cols-[116px_1fr_auto] sm:gap-x-6"
                      >
                        <time
                          dateTime={e.startISO}
                          className="text-meta tabular-nums text-text-muted"
                        >
                          {e.weekday} {e.month} {e.dayNum}
                        </time>
                        <span className="text-body text-text-primary transition-colors group-hover:text-accent">
                          {e.title}
                        </span>
                        <span className="col-start-2 text-meta tabular-nums text-text-muted sm:col-start-3 sm:text-right">
                          {e.time}
                          {e.city ? ` · ${e.city}` : ""}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                // Honest failure. An empty index means the feed broke, and
                // saying so beats decoration that hides it.
                <p className="px-5 py-8 text-body text-text-secondary">
                  No events are loading right now. This is a fault on our side, not an
                  empty calendar.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
