"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"
import { DateThumb } from "@/components/events/date-thumb"

// Mobbin-grade hero. No gradient text, no violet CTA glow, no rainbow
// avatar stacks, no colored icon swatches. The section earns its weight
// through composition, typographic contrast, and restraint.

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.5 + i * 0.1,
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

function MockEventCard() {
  // Shape mirrors the real EventCard pattern — keeps the landing honest.
  const startDate = new Date(Date.now() + 1000 * 60 * 60 * 12)
  return (
    <div className="w-[280px] rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-stretch gap-3">
        <div className="w-[64px] h-[64px] rounded-xl overflow-hidden flex-shrink-0">
          <DateThumb startDate={startDate} title="Founders Mixer" className="rounded-xl" />
        </div>
        <div className="min-w-0 flex flex-col justify-center gap-1">
          <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted font-medium">Tonight · 7:00 PM</p>
          <p className="text-[14px] font-semibold text-text-primary leading-snug">AI Founders Mixer</p>
          <p className="text-[11px] text-text-secondary">San Francisco</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">Cerebral Valley</span>
        <span className="inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted border border-border-subtle">
          Networking
        </span>
      </div>
    </div>
  )
}

function MockInternshipCard() {
  return (
    <div className="w-[280px] rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        {/* Monogram mark instead of a colored swatch. Reads as a placeholder
            for a real company logo without flashing a brand color. */}
        <div className="w-[64px] h-[64px] rounded-xl border border-border-subtle bg-bg-elevated flex items-center justify-center flex-shrink-0">
          <span className="font-display text-[22px] font-bold text-text-secondary tracking-tight">S</span>
        </div>
        <div className="min-w-0 flex flex-col justify-center gap-1">
          <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted font-medium">Summer 2026 · Remote</p>
          <p className="text-[14px] font-semibold text-text-primary leading-snug">Software Engineering Intern</p>
          <p className="text-[11px] text-text-secondary">Stripe</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">Posted 2h ago</span>
        <span className="inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted border border-border-subtle">
          Apply
        </span>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative min-h-[88vh] flex flex-col items-center justify-center pt-32 pb-24 px-4 overflow-hidden">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-[920px] mx-auto">
        {/* Eyebrow — monochrome, tracked, no pulse dot, no violet halo. */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.22em] uppercase border border-border-subtle text-text-secondary mb-10">
            Early Access · Free to Join
          </span>
        </motion.div>

        {/* H1 — flat white, weight + italic contrast carries the emphasis,
            no gradient wash, no purple/pink anything. */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="font-display font-bold text-text-primary mb-7"
          style={{
            fontSize: "clamp(2.5rem, 6.5vw, 5.25rem)",
            lineHeight: "1.02",
            letterSpacing: "-0.035em",
          }}
        >
          Find your next opportunity.
          <br />
          <span className="text-text-secondary font-light italic" style={{ letterSpacing: "-0.04em" }}>
            Make connections that matter.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-[16px] sm:text-[17px] text-text-secondary max-w-[560px] leading-[1.55] mb-10"
        >
          Internships and networking events tailored to you — all in one place.
          Stop scrolling five platforms.
        </motion.p>

        {/* CTAs — solid monochrome primary, hairline outline secondary.
            Identical px/py rhythm, no gradient, no drop-shadow halo. */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href="/auth/signin"
            className="
              group inline-flex items-center gap-2 px-6 py-3 rounded-full
              text-[14px] font-semibold
              bg-text-primary text-bg-base
              hover:bg-text-primary/90
              transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
            "
          >
            Start for free
            <ArrowRight
              size={15}
              strokeWidth={2}
              className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
            />
          </Link>

          <Link
            href="#how-it-works"
            className="
              inline-flex items-center gap-2 px-6 py-3 rounded-full
              text-[14px] font-medium text-text-secondary
              border border-border-subtle
              hover:border-border-strong hover:text-text-primary
              transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
            "
          >
            See how it works
          </Link>
        </motion.div>

        {/* Quiet social proof — one line. No rainbow avatar stack. */}
        <motion.p
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-12 text-[11px] uppercase tracking-[0.22em] text-text-muted"
        >
          Trusted by 500+ students at top campuses
        </motion.p>
      </div>

      {/* Honest preview cards — same shape as the real product, monochrome. */}
      <div className="relative z-10 mt-24 w-full max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-5 md:items-end">
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 280, damping: 22 } }}
            className="md:mb-10"
          >
            <MockEventCard />
          </motion.div>

          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 280, damping: 22 } }}
          >
            <MockInternshipCard />
          </motion.div>
        </div>

        {/* Bottom fade — pure base color, no violet undertone */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #070713)" }}
        />
      </div>

      {/* Restrained scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={18} strokeWidth={1.5} className="text-text-faint" />
        </motion.div>
      </motion.div>
    </section>
  )
}
