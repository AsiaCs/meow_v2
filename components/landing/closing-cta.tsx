"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

// Mini-minimalist closing CTA — required Mobbin/skill move.
//
// Mostly negative space. One oversized restrained headline, a tracked label,
// and a single thin underlined CTA. No pill, no card, no glow. The page has
// already done the work — this section lets it land.
//
// Composition anchor: stacked center
// Background mode: solid surface with the editorial grid bleeding through
// CTA variation: oversized headline + tiny underlined CTA hint (NOT a pill —
//   varied from the hero's white pill per skill rule §2 / §18)

export default function ClosingCta() {
  return (
    <section className="relative py-40 sm:py-56 px-4 overflow-hidden">
      {/* Archive index, top-left — second-read motif carried through */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="absolute top-12 left-6 sm:left-10 hidden md:flex flex-col gap-1 text-text-faint pointer-events-none select-none"
      >
        <span className="text-[10px] tracking-[0.32em] uppercase font-medium tabular-nums">№ 999 / Colophon</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="absolute top-12 right-6 sm:right-10 hidden md:block text-text-faint pointer-events-none select-none text-right"
      >
        <span className="text-[10px] tracking-[0.32em] uppercase font-medium">End of Index</span>
      </motion.div>

      <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Tracked eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex items-center gap-4 mb-10"
        >
          <span className="h-px w-8 bg-border-strong" />
          <span className="text-[10px] uppercase tracking-[0.28em] font-medium text-text-muted">
            Your turn
          </span>
          <span className="h-px w-8 bg-border-strong" />
        </motion.div>

        {/* Oversized restrained headline — the CTA IS the headline */}
        <motion.h2
          initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="font-display font-bold text-text-primary mb-12"
          style={{
            fontSize: "clamp(2.5rem, 8vw, 6.5rem)",
            lineHeight: "0.98",
            letterSpacing: "-0.045em",
          }}
        >
          Start showing up.
          <br />
          <span className="text-text-secondary font-light italic" style={{ letterSpacing: "-0.05em" }}>
            The archive is open.
          </span>
        </motion.h2>

        {/* Thin underlined CTA — NOT a pill. Varied from the hero per skill rule. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <Link
            href="/auth/signin"
            className="
              group inline-flex items-center gap-2.5
              text-[14px] font-semibold uppercase tracking-[0.24em] text-text-primary
              relative pb-2
              after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0
              after:h-px after:bg-text-primary after:origin-left after:scale-x-100
              after:transition-transform after:duration-[420ms] after:ease-[cubic-bezier(0.16,1,0.3,1)]
              hover:after:scale-x-0
            "
          >
            Get started for free
            <ArrowUpRight
              size={16}
              strokeWidth={2}
              className="transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </motion.div>

        {/* Footnote — colophon register */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 text-[11px] uppercase tracking-[0.24em] text-text-faint"
        >
          No credit card · No paywalls · No upsell
        </motion.p>
      </div>
    </section>
  )
}
