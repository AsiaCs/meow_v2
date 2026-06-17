"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Search, Clock, Users, MapPin } from "lucide-react"
import { Aurora, Room } from "./aurora"

// Hero — exact port of design/meow-v2/project/meow UI.html (Landing artboard).
// No extra sections, no archival slugs, no Mobbin-pass overlays. Just the
// designed landing: aurora + bg-room, eyebrow, H1 with .u-cool accent,
// subtitle, Perplexity tinted-glass search panel, three peek event cards.

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
      delay: 0.65 + i * 0.12,
      duration: 0.95,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

const FILTER_PILLS = [
  { label: "Near me", icon: <NearIcon />, active: true },
  { label: "This week", icon: <CalendarIcon />, active: false },
  { label: "Internships", icon: <BriefcaseIcon />, active: false },
  { label: "For you", icon: <SparkIcon />, active: false },
]

// Mirrors EVENTS[0..2] from meow-kit.jsx verbatim — same titles, hosts,
// tags, distances, and attending counts so the peek cards read as the
// real product rather than placeholder mocks.
const PEEK_EVENTS = [
  {
    title: "Cerebral Valley AI Summit",
    host: "Cerebral Valley",
    when: "Thu · 9:00 AM",
    place: "Pier 27 · San Francisco",
    dist: "1.2 mi",
    going: 480,
    tag: "Summit",
    mo: "NOV",
    day: "14",
    cover: null,
  },
  {
    title: "Latent Space — Paper Club",
    host: "Latent.Space",
    when: "Sat · 11:00 AM",
    place: "Notion HQ · San Francisco",
    dist: "0.8 mi",
    going: 120,
    tag: "Meetup",
    mo: "NOV",
    day: "09",
    cover: null,
  },
  {
    title: "AI Tinkerers · Hack Night",
    host: "AI Tinkerers",
    when: "Tue · 6:30 PM",
    place: "GitHub HQ · San Francisco",
    dist: "2.4 mi",
    going: 90,
    tag: "Hack",
    mo: "NOV",
    day: "12",
    cover: null,
  },
]

function NearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}
function BriefcaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="3" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  )
}
function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" />
    </svg>
  )
}

// Cover panel — matches the design's Cover() component from meow-kit.jsx.
// Image gradient with top-right specular glow + month/day overlay when
// `cover` is set, otherwise the #1a102f fallback panel with spaced month
// over a massive day numeral.
function Cover({ cover, mo, day }: { cover: string | null; mo: string; day: string }) {
  if (cover) {
    return (
      <div
        className="h-[132px] rounded-[13px] relative overflow-hidden"
        style={{ backgroundImage: cover, backgroundSize: "cover" }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 80% at 80% -10%, rgba(255,255,255,.35), transparent 55%)" }}
        />
        <div
          className="absolute left-3.5 top-3 flex flex-col items-center leading-none"
          style={{ color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,.4)" }}
        >
          <span className="font-bold text-[11px] tracking-[0.26em]">{mo}</span>
          <span className="font-extrabold text-[26px] leading-none mt-0.5" style={{ letterSpacing: "-0.04em" }}>
            {day}
          </span>
        </div>
      </div>
    )
  }
  return (
    <div
      className="h-[132px] rounded-[13px] relative overflow-hidden flex flex-col items-center justify-center gap-1.5"
      style={{
        background:
          "radial-gradient(120% 90% at 80% 0%, rgba(168,85,247,.28), rgba(26,16,47,0) 60%), #1a102f",
      }}
    >
      <span
        className="font-bold text-[12px] uppercase"
        style={{ letterSpacing: "0.34em", color: "rgba(245,242,252,.62)" }}
      >
        {mo}
      </span>
      <span
        className="font-display font-extrabold text-text-primary leading-[0.86]"
        style={{ fontSize: "60px", letterSpacing: "-0.04em" }}
      >
        {day}
      </span>
    </div>
  )
}

function PeekCard({ ev }: { ev: typeof PEEK_EVENTS[number] }) {
  return (
    <div className="glass rounded-[20px] p-2.5 flex flex-col gap-2.5 w-[320px]">
      <Cover cover={ev.cover} mo={ev.mo} day={ev.day} />
      <div className="px-1 pb-1">
        {/* Tag pill + distance */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold text-text-secondary bg-white/[0.055] border border-white/[0.11]">
            {ev.tag}
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-purple-light">
            <MapPin size={13} strokeWidth={1.8} />
            {ev.dist}
          </span>
        </div>

        {/* Title */}
        <div
          className="font-display font-bold text-[17px] leading-[1.18] text-text-primary"
          style={{ letterSpacing: "-0.01em" }}
        >
          {ev.title}
        </div>

        {/* When row */}
        <div className="flex items-center gap-1.5 mt-2 text-text-secondary text-[13.5px] font-medium">
          <Clock size={14} strokeWidth={1.7} />
          {ev.when}
        </div>

        {/* Host + going count */}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-text-muted text-[13px] font-medium">{ev.host}</span>
          <span className="inline-flex items-center gap-1 text-text-secondary text-[13px] font-semibold">
            <Users size={14} strokeWidth={1.7} />
            {ev.going}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center pt-32 pb-12 px-4 overflow-hidden">
      {/* Background stack */}
      <Room />
      <Aurora />

      {/* Content — exactly matches design's hero block (no archival slugs) */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-[980px] mx-auto w-full">
        {/* Eyebrow */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <span className="inline-block text-[13px] font-semibold tracking-[0.18em] uppercase text-text-secondary mb-5">
            Curiosity, organized
          </span>
        </motion.div>

        {/* H1 — Urbanist ExtraBold (matches the sidebar font register).
            Plain white, no gradient. Emphasis comes from weight + size,
            not from color. */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="font-display font-extrabold text-text-primary"
          style={{
            fontSize: "clamp(2.75rem, 7vw, 5rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
          }}
        >
          Every AI event & internship,
          <br />
          in one place.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-[18px] sm:text-[20px] text-text-secondary font-medium max-w-[600px] mx-auto leading-[1.5] mt-7"
        >
          Talks, hackathons, mixers and open roles from the people building the future —
          near you, updated in real time.
        </motion.p>

        {/* Perplexity tinted-glass search */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="glass rounded-[24px] p-3.5 w-full max-w-[680px] mx-auto mt-9"
        >
          <div className="field-light rounded-2xl px-4 py-[17px] flex items-center gap-3">
            <Search size={22} strokeWidth={1.8} className="text-[#5d666f] flex-shrink-0" />
            <span className="ph text-[17px] font-medium">Search events near you…</span>
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="ml-auto inline-block w-[2.5px] h-[22px] rounded-[2px] bg-[#0c1116]"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap pt-3.5 pb-1 px-1.5">
            {FILTER_PILLS.map(({ label, icon, active }) => (
              <span
                key={label}
                className={
                  active
                    ? "pill-on inline-flex items-center gap-1.5 rounded-full px-3.5 py-[9px] text-[13.5px] font-semibold"
                    : "inline-flex items-center gap-1.5 rounded-full px-3.5 py-[9px] text-[13.5px] font-semibold text-text-secondary bg-white/[0.055] border border-white/[0.11]"
                }
              >
                <span className={active ? "text-[#a855f7]" : "text-text-muted"}>{icon}</span>
                {label}
              </span>
            ))}
            <Link href="/events" className="btn-brand !rounded-[14px] !px-[22px] !py-[11px] ml-auto !text-[14px]">
              Explore
              <ArrowRight size={15} strokeWidth={2.2} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Three perspective peek cards bleeding off the bottom edge — exact
          design pattern from meow-web.jsx Landing(). Middle card lifts -14px
          for cinema framing; bottom mask fades them into the page below. */}
      <div
        className="relative mt-16 w-full max-w-[1080px] hidden md:flex gap-5 justify-center"
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
            whileHover={{
              y: i === 1 ? -22 : -8,
              transition: { type: "spring", stiffness: 280, damping: 22 },
            }}
          >
            <PeekCard ev={ev} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
