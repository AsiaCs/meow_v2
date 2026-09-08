"use client"

import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { ArrowUpRight } from "@phosphor-icons/react"

// ── Closing CTA ─────────────────────────────────────────────────────────────
//
// Mostly negative space. One oversized headline carrying an italic emphasis
// line in the same family, and one CTA. The page has already made the argument;
// this section only has to let it land.
//
// Three things the previous revision did that the audit removed:
//
//   1. Two decorative corner strips reading "№ 999 / Colophon" and "End of
//      Index". Section-numbering micro-meta is the single most recognisable
//      generated-page tell, and neither string told a reader anything.
//   2. A third uppercase tracked eyebrow ("Your turn") between two hairlines.
//      Six sections on this page were carrying thirteen of these labels; the
//      budget is two, and the hero spends one.
//   3. Motion that never checked prefers-reduced-motion. The CSS backstop in
//      globals.css cannot reach a JS-driven transform, so this branches on the
//      query itself and renders the resting state directly.
//
// CTA intent: this page carries exactly three, one label each. The hero owns
// "browse" (it goes to the index), the nav and this section share "Sign in"
// verbatim, and "Post an event" appears once in the hero and once in the
// footer. Two labels for the same intent is how a page starts feeling
// generated, so the closing CTA reuses the nav's label rather than inventing
// a third phrasing of the same action.

export default function ClosingCta() {
  const reduced = useReducedMotion()

  const rise = (delay: number) =>
    reduced
      ? { initial: false as const, whileInView: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          transition: {
            duration: 0.6,
            delay,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          },
        }

  return (
    <section className="relative overflow-hidden border-b border-border-subtle px-6 py-32 sm:py-44">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.h2
          {...rise(0)}
          viewport={{ once: true, margin: "-80px" }}
          className="text-display text-text-primary"
        >
          Start showing up.
          <br />
          <span className="text-text-muted">The archive is open.</span>
        </motion.h2>

        <motion.div
          {...rise(0.12)}
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12"
        >
          <Link href="/auth/signin" className="btn btn-primary group">
            Sign in
            <ArrowUpRight
              size={16}
              weight="bold"
              className="transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </motion.div>

        <motion.p
          {...rise(0.24)}
          viewport={{ once: true, margin: "-80px" }}
          className="mt-8 text-body text-text-muted"
        >
          Browsing needs no account. Signing in saves events and sends the
          weekly digest.
        </motion.p>
      </div>
    </section>
  )
}
