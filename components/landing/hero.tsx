"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Calendar, Briefcase, Users, ChevronDown } from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 32, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.08,
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.6 + i * 0.12,
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

function EventCard() {
  return (
    <div className="w-64 rounded-2xl border border-white/[0.06] p-2 bg-white/[0.02]">
      <div className="bg-bg-card rounded-[calc(1rem-0.5rem)] p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))", border: "1px solid rgba(124,58,237,0.3)" }}>
            <Calendar size={16} strokeWidth={1.5} className="text-purple-light" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-secondary mb-0.5">Tonight · SF</p>
            <p className="text-sm font-semibold text-text-primary leading-snug">AI Founders Mixer</p>
            <p className="text-xs text-text-muted mt-1">42 attending · Cerebral Valley</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-2">
            {["7C3AED", "EC4899", "3B82F6"].map((c, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-card" style={{ background: `#${c}` }} />
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-bg-card bg-bg-elevated flex items-center justify-center">
              <span className="text-[9px] text-text-secondary">+8</span>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full text-purple-light" style={{ background: "rgba(124,58,237,0.15)" }}>RSVP</span>
        </div>
      </div>
    </div>
  )
}

function InternshipCard() {
  return (
    <div className="w-64 rounded-2xl border border-white/[0.06] p-2 bg-white/[0.02]">
      <div className="bg-bg-card rounded-[calc(1rem-0.5rem)] p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(124,58,237,0.2))", border: "1px solid rgba(59,130,246,0.3)" }}>
            <Briefcase size={16} strokeWidth={1.5} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-secondary mb-0.5">Summer 2025 · Remote</p>
            <p className="text-sm font-semibold text-text-primary leading-snug">Software Eng Intern</p>
            <p className="text-xs text-text-muted mt-1">Stripe · via Handshake</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-text-secondary">Posted 2h ago</span>
          <span className="text-xs px-2 py-0.5 rounded-full text-blue-400" style={{ background: "rgba(59,130,246,0.15)" }}>Apply</span>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-24 px-4 overflow-hidden">
      {/* Mobbin-grade hero: structure carries the section, not decoration.
          The decorative violet/pink blobs and animated orbs have been removed
          deliberately — Mobbin establishes premium quality with composition
          and typography, never with floating ambient lights. */}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
        {/* Eyebrow */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border border-purple/40 text-purple-light mb-8"
            style={{ background: "rgba(124,58,237,0.1)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-light animate-pulse" />
            Early Access — Free to Join
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.08] tracking-tight text-text-primary mb-6"
        >
          Find your next{" "}
          <span className="gradient-text">opportunity</span>
          {"."} Make{" "}
          <span className="gradient-text">connections</span>
          {" "}that matter.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed mb-10"
        >
          Meow surfaces internships and networking events tailored to you — all in one place. Stop scrolling five platforms. Start building your future.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/auth/signin"
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-base font-semibold text-white shadow-[0_0_32px_rgba(124,58,237,0.4)]"
              style={{ background: "var(--gradient-brand)" }}
            >
              <span>Start for free</span>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <ArrowRight size={13} strokeWidth={2} />
              </span>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-medium text-text-secondary border border-white/[0.1] hover:border-white/[0.2] hover:text-text-primary transition-all duration-300"
            >
              See how it works
            </Link>
          </motion.div>
        </motion.div>

        {/* Social proof */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-10 flex items-center gap-3"
        >
          <div className="flex -space-x-2">
            {["7C3AED", "EC4899", "3B82F6", "10B981", "F59E0B"].map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-base" style={{ background: `#${c}` }} />
            ))}
          </div>
          <p className="text-sm text-text-secondary">
            <span className="text-text-primary font-semibold">500+</span> students already discovering opportunities
          </p>
        </motion.div>
      </div>

      {/* Floating cards */}
      <div className="relative z-10 mt-20 w-full max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 md:items-end">
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
            className="md:mb-8"
          >
            <EventCard />
          </motion.div>

          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
          >
            <InternshipCard />
          </motion.div>

        </div>

        {/* Fade out gradient below cards */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #080810)" }} />
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} strokeWidth={1.5} className="text-text-muted" />
        </motion.div>
      </motion.div>
    </section>
  )
}
