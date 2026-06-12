"use client"

import { motion } from "framer-motion"
import { UserCircle2, Sparkles, ExternalLink } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: UserCircle2,
    title: "Create your profile",
    description:
      "Set your interests, location, and experience level. The more specific you are, the better Meow tailors your feed to what actually matters to you.",
    details: ["Your interests & goals", "Current location or target city", "Experience level & skills"],
    color: "rgba(124,58,237,0.8)",
    glow: "rgba(124,58,237,0.3)",
    iconBg: "rgba(124,58,237,0.15)",
    borderColor: "rgba(124,58,237,0.3)",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Discover what's out there",
    description:
      "Get a personalized feed of upcoming events and open internships — all matched to your profile. Updated daily, no stale listings.",
    details: ["Events happening near you", "Internships that match your skills", "RSVPs in one tap"],
    color: "rgba(157,90,245,0.8)",
    glow: "rgba(157,90,245,0.3)",
    iconBg: "rgba(157,90,245,0.15)",
    borderColor: "rgba(157,90,245,0.3)",
  },
  {
    number: "03",
    icon: ExternalLink,
    title: "Connect and apply",
    description:
      "One click takes you directly to the application, RSVP page, or LinkedIn profile. No forms inside Meow — just the direct link you need.",
    details: ["Direct LinkedIn outreach links", "Application pages, not job boards", "Event RSVPs in one click"],
    color: "rgba(236,72,153,0.8)",
    glow: "rgba(236,72,153,0.3)",
    iconBg: "rgba(236,72,153,0.15)",
    borderColor: "rgba(236,72,153,0.3)",
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 32, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 px-4 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <span className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full border border-purple/40 text-purple-light mb-5"
              style={{ background: "rgba(124,58,237,0.1)" }}>
              How it works
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-5 tracking-tight"
          >
            Up and running in{" "}
            <span className="gradient-text">three steps.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-lg text-text-secondary max-w-xl mx-auto leading-relaxed"
          >
            No lengthy onboarding. No hidden setup. Just a few seconds to tell us about yourself and you&apos;re ready.
          </motion.p>
        </div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative"
        >
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-[3.5rem] left-[16.5%] right-[16.5%] h-px"
            style={{ background: "linear-gradient(to right, rgba(124,58,237,0.3), rgba(157,90,245,0.4), rgba(236,72,153,0.3))" }} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
                  className="flex flex-col"
                >
                  {/* Step card outer bezel */}
                  <div className="rounded-3xl border border-white/[0.06] p-2 bg-white/[0.02] h-full">
                    <div className="bg-bg-card rounded-[calc(1.5rem-0.5rem)] p-6 h-full flex flex-col">
                      {/* Number + icon row */}
                      <div className="flex items-center gap-4 mb-6">
                        {/* Icon circle */}
                        <div
                          className="relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: step.iconBg, border: `1px solid ${step.borderColor}`, boxShadow: `0 0 24px ${step.glow}` }}
                        >
                          <Icon size={22} strokeWidth={1.5} style={{ color: step.color }} />
                          {/* Number badge */}
                          <div
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: step.color, boxShadow: `0 0 12px ${step.glow}` }}
                          >
                            {i + 1}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">
                            Step {step.number}
                          </span>
                          <h3 className="font-display text-lg font-semibold text-text-primary leading-snug">
                            {step.title}
                          </h3>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-text-secondary leading-relaxed mb-6 flex-1">
                        {step.description}
                      </p>

                      {/* Detail list */}
                      <ul className="space-y-2.5">
                        {step.details.map((detail, j) => (
                          <li key={j} className="flex items-center gap-3">
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: step.color }}
                            />
                            <span className="text-sm text-text-secondary">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="mt-16 text-center"
        >
          <motion.a
            href="/auth/signin"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold text-white shadow-[0_0_40px_rgba(124,58,237,0.3)]"
            style={{ background: "var(--gradient-brand)" }}
          >
            Get started for free
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <ExternalLink size={13} strokeWidth={2} />
            </span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
