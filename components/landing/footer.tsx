import Link from "next/link"
import { MeowWordmark } from "@/components/brand/meow-wordmark"

// ── Footer ──────────────────────────────────────────────────────────────────
//
// Closes the editorial-index register the rest of the page is built in: a
// mono kicker per column, hairline rules, no card, no icon-mark (the rainbow
// glyph in meow-logo.tsx hasn't been carried over to the brass system yet —
// nav.tsx already made the same call and ships wordmark-only).
//
// Server component. Nothing here needs client JS; the reveal is the same
// CSS-only .enter used across the page so it can't get stuck invisible in a
// backgrounded tab.

const INDEX_LINKS = [
  { label: "Events", href: "/events" },
  { label: "Internships", href: "/internships" },
  { label: "Post an event", href: "/submit" },
]

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">
          <div className="enter md:col-span-6" style={{ "--i": 0 } as React.CSSProperties}>
            <Link href="/" aria-label="meow — home" className="inline-flex">
              <MeowWordmark size={22} />
            </Link>
            <p className="mt-4 max-w-[38ch] text-body-m text-text-secondary">
              Every AI event and internship, indexed and kept current — so you
              stop checking five feeds and start showing up.
            </p>
          </div>

          <nav
            className="enter md:col-span-3"
            style={{ "--i": 1 } as React.CSSProperties}
            aria-label="Index"
          >
            <h2 className="font-mono text-meta uppercase tracking-[0.14em] text-text-muted">
              Index
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {INDEX_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="link-underline text-body-m text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            className="enter md:col-span-3"
            style={{ "--i": 2 } as React.CSSProperties}
            aria-label="Legal"
          >
            <h2 className="font-mono text-meta uppercase tracking-[0.14em] text-text-muted">
              Legal
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="link-underline text-body-m text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div
          className="enter mt-14 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <p className="font-mono text-meta tabular-nums text-text-faint">
            © {new Date().getFullYear()} meow
          </p>
          <p className="text-body-m text-text-faint">
            Built for the people who show up.
          </p>
        </div>
      </div>
    </footer>
  )
}
