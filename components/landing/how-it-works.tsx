import Link from "next/link"

// ── How it works ────────────────────────────────────────────────────────────
//
// Three steps, deliberately NOT three cards in a row. The banned pattern is the
// equal-width card triptych — boxes, shadows, an icon on top of each. These are
// full-width editorial rows: a large mono numeral in the margin, the step set
// as running text, hairline rules between. It reads as a numbered list in a
// printed document, which is what it actually is.
//
// No icons here at all. An icon per step would be decoration standing in for
// content; the numeral already carries the sequence.

const STEPS = [
  {
    n: "01",
    title: "Tell it where you are",
    body: "Set a city once. Everything reorders around it — the feed, the calendar, the week ahead. Change it whenever you travel.",
  },
  {
    n: "02",
    title: "It watches the sources for you",
    body: "Luma and Cerebral Valley get re-read every half hour. New listings appear without you refreshing anything, and dead links get pruned rather than left to rot.",
  },
  {
    n: "03",
    title: "Add what it misses",
    body: "Anyone can submit an event. Submissions are reviewed before they publish, so the index stays worth reading.",
  },
]

export default function HowItWorks() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-20 md:py-28">
        <h2 className="font-mono text-meta uppercase tracking-[0.14em] text-text-muted">
          How it works
        </h2>

        <div className="mt-10">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="grid grid-cols-1 gap-y-3 border-t border-border py-10 last:border-b md:grid-cols-12 md:gap-10"
            >
              <span className="font-mono text-meta tabular-nums text-text-faint md:col-span-2">
                {s.n}
              </span>
              <h3 className="font-display text-heading-l text-text-primary md:col-span-4">
                {s.title}
              </h3>
              <p className="max-w-[52ch] text-body-l text-text-secondary md:col-span-6">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <Link href="/auth/signin" className="link-underline text-body-l font-medium text-brand">
            Start with your city
          </Link>
        </div>
      </div>
    </section>
  )
}
