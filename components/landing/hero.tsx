"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Search, Navigation, Calendar, Briefcase, Sparkles } from "lucide-react"
import { Aurora, Room } from "./aurora"
import { DateThumb } from "@/components/events/date-thumb"

// Hero — meow UI.html canonical landing.
//
// Composition: centered statement over an aurora + bg-room background, with
// the Perplexity-style tinted-glass search bar as the centerpiece and three
// perspective-tilted event cards peeking up from the bottom.
//
// Brand gradient is restored on a single H1 accent line and the primary CTA —
// that's the deliberate brand color (chat1.md), not generic AI purple slop.

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.7 + i * 0.12,
      duration: 0.95,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

const FILTER_PILLS = [
  { icon: Navigation, label: "Near me", active: true },
  { icon: Calendar, label: "This week", active: false },
  { icon: Briefcase, label: "Internships", active: false },
  { icon: Sparkles, label: "For you", active: false },
]

// Mock cards mirror the meow-kit.jsx EVENTS shape so the peek-cards
// feel like the real product, not stock placeholders.
const PEEK_EVENTS = [
  {
    title: "Cerebral Valley AI Summit",
    host: "Cerebral Valley",
    when: "Thu · 9:00 AM",
    place: "Pier 27 · San Francisco",
    dist: "1.2 mi",
    going: 480,
    tag: "Summit",
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
  },
  {
    title: "Latent Space — Paper Club",
    host: "Latent.Space",
    when: "Sat · 11:00 AM",
    place: "Notion HQ · San Francisco",
    dist: "0.8 mi",
    going: 120,
    tag: "Meetup",
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
  },
  {
    title: "Anthropic Builder Day",
    host: "Anthropic",
    when: "Wed · 10:00 AM",
    place: "SoMa · San Francisco",
    dist: "1.9 mi",
    going: 300,
    tag: "Workshop",
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  },
]

function PeekCard({ ev }: { ev: typeof PEEK_EVENTS[number] }) {
  return (
    <div className="glass rounded-[20px] p-2.5 flex flex-col gap-2.5 w-[320px]">
      <div className="h-[132px] rounded-[13px] overflow-hidden">
        <DateThumb startDate={ev.startDate} title={ev.title} className="rounded-[13px]" />
      </div>
      <div className="px-1 pb-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-text-secondary bg-white/[0.06] border border-white/[0.11]">
            {ev.tag}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-purple-light">
            <Navigation size={12} strokeWidth={1.8} />
            {ev.dist}
          </span>
        </div>
        <div className="font-display font-bold text-[16px] leading-snug text-text-primary" style={{ letterSpacing: "-0.01em" }}>
          {ev.title}
        </div>
        <div className="flex items-center justify-between mt-2 text-[12px]">
          <span className="text-text-muted font-medium">{ev.host}</span>
          <span className="text-text-secondary font-semibold">{ev.going}</span>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center pt-32 pb-48 px-4 overflow-hidden">
      {/* Background stack — Room → Aurora → subtle hairline grid */}
      <Room />
      <Aurora />
      <div className="hero-grid absolute inset-0 pointer-events-none" />

      {/* Archival index — second-read motif preserved from prior pass */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="absolute top-28 left-6 sm:left-10 hidden md:flex flex-col gap-1 text-text-faint pointer-events-none select-none z-10"
      >
        <span className="text-[10px] tracking-[0.32em] uppercase font-medium tabular-nums">№ 001 / Index</span>
        <span className="text-[10px] tracking-[0.24em] uppercase tabular-nums">Vol. 06 · 2026</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="absolute top-28 right-6 sm:right-10 hidden md:block text-text-faint pointer-events-none select-none z-10 text-right"
      >
        <span className="text-[10px] tracking-[0.32em] uppercase font-medium">Discover · Connect · Apply</span>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-[980px] mx-auto">
        {/* Eyebrow */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <span className="inline-block text-[13px] font-semibold tracking-[0.18em] uppercase text-text-secondary mb-7">
            Curiosity, organized
          </span>
        </motion.div>

        {/* H1 — Urbanist ExtraBold, single line with the brand gradient
            applied to the closing phrase only. NO white text on top. */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="font-display font-extrabold text-text-primary mb-8"
          style={{
            fontSize: "clamp(2.75rem, 7.5vw, 5rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
          }}
        >
          Every AI event & internship,
          <br />
          <span className="u-cool">in one place.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-[18px] sm:text-[20px] text-text-secondary font-medium max-w-[600px] mx-auto leading-[1.5] mb-10"
        >
          Talks, hackathons, mixers and open roles from the people building the future —
          near you, updated in real time.
        </motion.p>

        {/* Perplexity tinted-glass search — dark glass outer panel holding
            a light frosted inner field. Below it sit four filter pills + a
            primary brand CTA. */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="glass rounded-[24px] p-3.5 w-full max-w-[680px] mx-auto"
        >
          {/* Light frosted inner field */}
          <div className="field-light rounded-2xl px-4 py-4 flex items-center gap-3">
            <Search size={20} strokeWidth={1.8} className="text-[#5d666f] flex-shrink-0" />
            <span className="ph text-[16px] font-medium">Search events near you…</span>
            {/* Blinking caret */}
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="ml-auto inline-block w-[2.5px] h-[22px] rounded-[2px] bg-[#0c1116]"
            />
          </div>

          {/* Pill row + primary action */}
          <div className="flex items-center gap-2 flex-wrap pt-3.5 pb-1 px-1.5">
            {FILTER_PILLS.map(({ icon: Icon, label, active }) => (
              <span
                key={label}
                className={
                  active
                    ? "pill-on inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold"
                    : "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold text-text-secondary bg-white/[0.055] border border-white/[0.11]"
                }
              >
                <Icon size={14} strokeWidth={1.8} className={active ? "text-purple" : "text-text-muted"} />
                {label}
              </span>
            ))}
            <Link
              href="/events"
              className="btn-brand !rounded-full !py-2.5 !px-5 ml-auto !text-[13.5px]"
            >
              Explore
              <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
          </div>
        </motion.div>

        {/* Quiet social proof keyline */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-14 flex items-center gap-4 text-text-muted"
        >
          <span className="h-px w-10 bg-border-strong" />
          <span className="text-[11px] uppercase tracking-[0.24em] font-medium">
            Trusted by 500+ students at top campuses
          </span>
          <span className="h-px w-10 bg-border-strong" />
        </motion.div>
      </div>

      {/* Floating event cards peeking up from the bottom with perspective tilt */}
      <div
        className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-[min(1080px,94%)] hidden md:flex gap-5 justify-center"
        style={{
          perspective: 1400,
          WebkitMaskImage: "linear-gradient(180deg, #000 60%, transparent)",
          maskImage: "linear-gradient(180deg, #000 60%, transparent)",
        }}
      >
        {PEEK_EVENTS.map((ev, i) => (
          <motion.div
            key={ev.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            style={{
              transform: `rotateX(14deg) translateY(${i === 1 ? -14 : 0}px)`,
            }}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 280, damping: 22 } }}
          >
            <PeekCard ev={ev} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
