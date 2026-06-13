"use client"

import { motion } from "framer-motion"
import { Briefcase, Calendar, CheckCircle2, MapPin, Link2, Bell, Search, ArrowUpRight } from "lucide-react"
import { DateThumb } from "@/components/events/date-thumb"

// Mobbin-grade editorial features section.
//
// Composition anchor: off-grid editorial split (50/50, alternating sides).
// Second-read motif: oversized 01 / 02 numerals serving as structural anchors —
// the "archive index" register that threads through the page.
// Background mode: solid surface with inline product UI panel stack.
// CTA variation: inline underlined link with arrow (different from hero pill).

const fadeUp = {
  hidden: { opacity: 0, y: 32, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

const sources = [
  "Cerebral Valley",
  "Luma",
  "Eventbrite",
  "LinkedIn",
  "Handshake",
  "Y Combinator",
]

const features = [
  {
    index: "01",
    icon: Briefcase,
    tag: "Internships",
    title: "The right internship, not every internship.",
    description:
      "Filtered by your location, interests, and experience level — so you only see roles that actually fit. Every Apply button deep-links to the real application, not the company's career homepage.",
    bullets: [
      { icon: MapPin, text: "Filter by city, remote, or hybrid" },
      { icon: Search, text: "Interest-based matching" },
      { icon: Link2, text: "Direct application links" },
    ],
    preview: "internship" as const,
  },
  {
    index: "02",
    icon: Calendar,
    tag: "Events",
    title: "Networking events, in one place.",
    description:
      "Scraped from Luma, Cerebral Valley, Eventbrite, and more — surfaced as a single calendar with proximity sorting, one-click RSVP, and the talks that actually matter near you.",
    bullets: [
      { icon: Bell, text: "Aggregated from top event platforms" },
      { icon: Calendar, text: "Calendar view with reminders" },
      { icon: Link2, text: "One-click RSVP links" },
    ],
    preview: "event" as const,
  },
]

function PreviewPanel({ kind }: { kind: "event" | "internship" }) {
  // A product UI panel stack — two cards layered with depth logic, hinting at
  // density behind the foreground card. Reads as "real archive" not "mockup."
  if (kind === "event") {
    const startDate = new Date(Date.now() + 1000 * 60 * 60 * 18)
    return (
      <div className="relative w-full max-w-[420px] aspect-[4/5] mx-auto">
        {/* Behind card */}
        <div className="absolute inset-x-6 top-8 bottom-2 rounded-2xl border border-border-subtle bg-bg-card/60 shadow-[var(--shadow-card)]" />
        {/* Foreground card */}
        <div
          className="absolute inset-x-0 top-0 bottom-8 rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-[var(--shadow-card-hover)] flex flex-col gap-4"
        >
          <div className="flex items-stretch gap-3">
            <div className="w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0">
              <DateThumb startDate={startDate} title="Founders Mixer" className="rounded-xl" />
            </div>
            <div className="min-w-0 flex flex-col justify-center gap-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-medium tabular-nums">Tomorrow · 7:00 PM</p>
              <p className="text-[15px] font-semibold text-text-primary leading-snug">Cerebral Valley AI Hackathon</p>
              <p className="text-[12px] text-text-secondary">SoMa · San Francisco</p>
            </div>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted uppercase tracking-[0.14em]">Distance</span>
              <span className="text-text-primary font-medium tabular-nums">1.8 mi away</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted uppercase tracking-[0.14em]">Source</span>
              <span className="text-text-primary font-medium">Cerebral Valley</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted uppercase tracking-[0.14em]">Format</span>
              <span className="text-text-primary font-medium">In Person · Free</span>
            </div>
          </div>

          <div className="mt-auto pt-3 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted tabular-nums">№ 042</span>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-text-primary">
              RSVP <ArrowUpRight size={12} strokeWidth={2} />
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-[420px] aspect-[4/5] mx-auto">
      <div className="absolute inset-x-6 top-8 bottom-2 rounded-2xl border border-border-subtle bg-bg-card/60 shadow-[var(--shadow-card)]" />
      <div className="absolute inset-x-0 top-0 bottom-8 rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-[var(--shadow-card-hover)] flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className="w-[72px] h-[72px] rounded-xl bg-bg-elevated flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)" }}
          >
            <span className="font-display font-bold text-text-primary" style={{ fontSize: "28px", letterSpacing: "-0.05em", lineHeight: 1 }}>S</span>
          </div>
          <div className="min-w-0 flex flex-col justify-center gap-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-medium tabular-nums">Posted 2h ago · Summer 26</p>
            <p className="text-[15px] font-semibold text-text-primary leading-snug">Software Engineering Intern</p>
            <p className="text-[12px] text-text-secondary">Stripe · Remote</p>
          </div>
        </div>

        <div className="border-t border-border-subtle" />

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-muted uppercase tracking-[0.14em]">Stipend</span>
            <span className="text-text-primary font-medium tabular-nums">$11,500 / mo</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-muted uppercase tracking-[0.14em]">Apply by</span>
            <span className="text-text-primary font-medium tabular-nums">Nov 18, 2026</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-muted uppercase tracking-[0.14em]">Match</span>
            <span className="text-text-primary font-medium">3 interest tags</span>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-border-subtle flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted tabular-nums">№ 118</span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-text-primary">
            Apply <ArrowUpRight size={12} strokeWidth={2} />
          </span>
        </div>
      </div>
    </div>
  )
}

function FeatureRow({ feature, index }: { feature: typeof features[0]; index: number }) {
  const isReversed = index % 2 === 1
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-12 items-center"
    >
      {/* Text block */}
      <div className={`md:col-span-6 ${isReversed ? "md:order-2 md:col-start-7" : ""}`}>
        <div className="flex items-baseline gap-5 mb-7">
          {/* Oversized numeric anchor — Mobbin signature, archive/dossier spine */}
          <span
            className="font-display font-light text-text-faint leading-none tabular-nums"
            style={{ fontSize: "clamp(3rem, 6vw, 5rem)", letterSpacing: "-0.05em" }}
          >
            {feature.index}
          </span>
          <span className="text-[10px] uppercase tracking-[0.28em] font-medium text-text-muted">
            {feature.tag}
          </span>
        </div>

        <h3
          className="font-display font-bold text-text-primary mb-5"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", lineHeight: 1.08, letterSpacing: "-0.025em" }}
        >
          {feature.title}
        </h3>

        <p className="text-[15px] sm:text-[16px] text-text-secondary leading-[1.65] max-w-[480px] mb-7">
          {feature.description}
        </p>

        {/* Bullets as a tracked archive list, not capsule chips */}
        <ul className="space-y-2.5 mb-8">
          {feature.bullets.map((bullet, i) => {
            const BulletIcon = bullet.icon
            return (
              <li key={i} className="flex items-center gap-3 text-[13px] text-text-secondary">
                <BulletIcon size={13} strokeWidth={1.5} className="text-text-muted flex-shrink-0" />
                <span>{bullet.text}</span>
              </li>
            )
          })}
        </ul>

        {/* CTA variation — inline underlined link with arrow, NOT another white pill */}
        <a
          href={feature.preview === "event" ? "/events" : "/internships"}
          className="
            inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.18em]
            text-text-primary
            relative pb-1
            after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0
            after:h-px after:bg-text-primary after:origin-left after:scale-x-100
            after:transition-transform after:duration-[360ms] after:ease-[cubic-bezier(0.16,1,0.3,1)]
            hover:after:scale-x-0
          "
        >
          Browse the archive
          <ArrowUpRight size={14} strokeWidth={2} className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5" />
        </a>
      </div>

      {/* Preview panel — product UI panel stack, layered with depth */}
      <div className={`md:col-span-6 ${isReversed ? "md:order-1 md:col-start-1" : ""}`}>
        <PreviewPanel kind={feature.preview} />
      </div>
    </motion.div>
  )
}

export default function Features() {
  return (
    <section className="py-32 px-4 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header — archival index style, not card spam */}
        <div className="mb-24 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="flex items-center gap-3 mb-6"
            >
              <span className="text-[10px] uppercase tracking-[0.28em] font-medium text-text-muted tabular-nums">
                Vol. 02 · The Archive
              </span>
              <span className="h-px w-10 bg-border-strong" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="font-display font-bold text-text-primary"
              style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", lineHeight: 1.02, letterSpacing: "-0.035em" }}
            >
              Two surfaces.{" "}
              <span className="text-text-secondary font-light italic" style={{ letterSpacing: "-0.04em" }}>
                One archive.
              </span>
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-[15px] text-text-secondary leading-[1.65] max-w-[360px] md:text-right"
          >
            Internships and events, indexed and surfaced as a single feed —
            so you stop scrolling five platforms and start showing up.
          </motion.p>
        </div>

        {/* Feature rows — alternating editorial split */}
        <div className="flex flex-col gap-32">
          {features.map((feature, i) => (
            <FeatureRow key={feature.index} feature={feature} index={i} />
          ))}
        </div>

        {/* Source list — tightened, no fake "trusted by" carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="mt-32 pt-12 border-t border-border-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <p className="text-[10px] uppercase tracking-[0.28em] font-medium text-text-muted">
            Indexed from
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {sources.map((source) => (
              <span
                key={source}
                className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.14em] text-text-secondary font-medium"
              >
                <CheckCircle2 size={11} strokeWidth={1.5} className="text-text-faint" />
                {source}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
