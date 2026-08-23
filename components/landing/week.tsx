"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

// ── The week ────────────────────────────────────────────────────────────────
//
// The one scroll-driven sequence on the site, and the only place GSAP is used.
// Everything else is CSS or Motion; layering libraries over the same element is
// what the brief warns against.
//
// PROGRESSIVE ENHANCEMENT, deliberately: the default state is a plain
// horizontally-scrollable track that works with no JS at all — you can swipe or
// shift-scroll it and read every event. GSAP then upgrades it to a pinned,
// scrubbed pan. If GSAP fails to load, or Reduce Motion is on, or the browser
// is old, you lose the pinning and keep the content. Same principle as the
// hero: motion may not be load-bearing for content.
//
// Reduce Motion is honoured explicitly here. HIG asks apps to reduce
// "automatic and repetitive animations, including zooming, scaling, and
// peripheral motion" — a scrubbed horizontal pan of the whole viewport is
// exactly that, and the CSS backstop in globals.css cannot reach a JS
// scroll-scrub, so it has to branch on the query itself.

export type WeekDay = {
  key: string
  weekday: string
  dayNum: string
  month: string
  events: { id: string; title: string; time: string; city: string | null }[]
}

export default function Week({ days }: { days: WeekDay[] }) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // Pinning a full-viewport pan is hostile on a small screen; leave the
    // native horizontal scroll in place there.
    if (!window.matchMedia("(min-width: 1024px)").matches) return

    let ctx: { revert: () => void } | null = null
    let cancelled = false

    ;(async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      ctx = gsap.context(() => {
        const distance = () => track.scrollWidth - track.clientWidth
        if (distance() <= 0) return

        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6, // scrub smooths the hand-off; it is not an easing curve
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        })
      }, section)
    })()

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [])

  if (days.length === 0) return null

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-b border-border">
      <div className="mx-auto w-full max-w-[1240px] px-6 pt-20 pb-6">
        <h2 className="font-mono text-meta uppercase tracking-[0.14em] text-text-muted">
          The week ahead
        </h2>
      </div>

      <div
        ref={trackRef}
        className="flex gap-px overflow-x-auto pb-20 lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((d) => (
          <div
            key={d.key}
            className="w-[min(84vw,420px)] shrink-0 border-l border-border px-6 first:ml-6 lg:w-[380px]"
          >
            <div className="flex items-baseline gap-3">
              {/* The numeral is the anchor — big, display face, tight. */}
              <span className="font-display text-display-m text-text-primary">{d.dayNum}</span>
              <span className="font-mono text-meta uppercase text-text-muted">
                {d.weekday} {d.month}
              </span>
            </div>

            <p className="mt-1 font-mono text-meta tabular-nums text-text-faint">
              {d.events.length} {d.events.length === 1 ? "event" : "events"}
            </p>

            <ul className="mt-6 border-t border-border">
              {d.events.slice(0, 6).map((e) => (
                <li key={e.id} className="border-b border-border">
                  <Link href={`/events/${e.id}`} className="group block py-3">
                    <span className="block text-body-m text-text-primary transition-colors duration-200 group-hover:text-brand">
                      {e.title}
                    </span>
                    <span className="mt-1 block font-mono text-meta text-text-faint">
                      {e.time}
                      {e.city ? ` · ${e.city}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {d.events.length > 6 && (
              <p className="pt-3 font-mono text-meta text-text-faint">
                +{d.events.length - 6} more
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
