import Link from "next/link"

// ── Hero ────────────────────────────────────────────────────────────────────
//
// The brief's structural note: nav → title → image → supporting text → CTA is
// the skeleton most landing pages collapse into, and it is a pattern to vary,
// not fill in. So this hero has no centred headline, no pair of buttons under
// it, and no product screenshot standing in for content.
//
// Instead the product IS the visual content. meow's actual asset is a live
// index of real events with real dates, so the hero is set as an editorial
// index: a typographic statement on the narrower left column, the genuine
// next-up listings on the wider right. Nothing here is staged — every row is a
// real event from the same endpoint /events renders.
//
// Deliberately a SERVER component. The entrance reveal is CSS (see .enter in
// globals.css), so this ships zero client JS: the content is in the HTML and
// visible without hydration. An earlier revision used framer-motion here and
// server-rendered the whole hero at opacity:0 — in a backgrounded tab, where
// requestAnimationFrame never fires, it stayed invisible indefinitely. Reveal
// animations must not be able to hide content.

// Times arrive pre-formatted in the EVENT's timezone (see lib/events/timezone.ts).
// Formatting here would use the server's zone, which on Vercel is UTC — that
// rendered a 7:30 PM San Francisco meetup as "2:30 AM · San Francisco".
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

export default function Hero({
  events,
  totalCount,
}: {
  events: HeroEvent[]
  totalCount: number
}) {
  return (
    <section className="relative border-b border-border">
      <div className="mx-auto w-full max-w-[1240px] px-6 pt-28 pb-16 md:pt-36 md:pb-24">
        {/* Asymmetric split — not a centred stack, not three equal columns.
            The index gets the wider column because the data is the argument. */}
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-10">
          {/* ── Statement ─────────────────────────────────────────────── */}
          <div className="lg:col-span-5">
            <p className="enter font-mono text-meta uppercase text-text-muted" style={{ "--i": 0 } as React.CSSProperties}>
              Updated every 30 minutes
            </p>

            <h1
              className="enter mt-6 font-display text-display-l text-text-primary md:text-display-xl"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              Every AI event and internship, in one index.
            </h1>

            <p
              className="enter mt-7 max-w-[42ch] text-body-l text-text-secondary"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              Talks, hackathons and mixers pulled from Luma and Cerebral Valley,
              alongside open roles. Filtered to your city, sorted by what happens next.
            </p>

            <div
              className="enter mt-9 flex items-baseline gap-7"
              style={{ "--i": 3 } as React.CSSProperties}
            >
              <Link href="/events" className="link-underline font-medium text-body-l text-brand">
                Browse {totalCount > 0 ? totalCount : "all"} events
              </Link>
              <Link href="/submit" className="link-underline text-body-m text-text-muted">
                Post an event
              </Link>
            </div>
          </div>

          {/* ── Live index ───────────────────────────────────────────────── */}
          <div className="lg:col-span-7">
            <div className="flex items-baseline justify-between">
              <h2 className="font-mono text-meta uppercase tracking-[0.14em] text-text-muted">
                Next up
              </h2>
              {events.length > 0 && (
                <span className="font-mono text-meta tabular-nums text-text-faint">
                  {events.length} of {totalCount}
                </span>
              )}
            </div>

            <ul className="mt-5 border-t border-border">
              {events.map((e, i) => {
                return (
                  <li
                    key={e.id}
                    className="enter-row border-b border-border"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <Link
                      href={`/events/${e.id}`}
                      className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 py-4 md:grid-cols-[132px_1fr_auto] md:gap-x-6"
                    >
                      {/* Numerics in the mono face so rows align down the page. */}
                      <time dateTime={e.startISO} className="font-mono text-meta tabular-nums text-text-muted">
                        {e.weekday} {e.month} {e.dayNum}
                      </time>
                      <span className="text-body-l text-text-primary transition-colors duration-200 group-hover:text-brand">
                        {e.title}
                      </span>
                      <span className="col-start-2 font-mono text-meta text-text-faint md:col-start-3 md:text-right">
                        {e.time}
                        {e.city ? ` · ${e.city}` : ""}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {events.length === 0 && (
              // Honest failure. An empty index means the feed broke, and saying
              // so beats decoration that hides it.
              <p className="border-b border-border py-6 text-body-m text-text-muted">
                No events are loading right now. This is a fault on our side, not an
                empty calendar.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
