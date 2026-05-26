"use client"

import { motion } from "framer-motion"
import { Check, Zap } from "lucide-react"
import Link from "next/link"

const freeTier = {
  name: "Free",
  price: "$0",
  period: "forever",
  description: "Start discovering opportunities with no commitment.",
  features: [
    "Browse limited event & internship listings",
    "Save up to 5 items",
    "Basic location filter",
    "Standard search",
  ],
  cta: "Get started free",
  ctaHref: "/auth/signin",
}

const proPlan = {
  name: "Meow+",
  price: "$9",
  yearlyPrice: "$79",
  period: "per month",
  yearlyNote: "or $79/yr — save 26%",
  description: "Everything you need to stay ahead of opportunities.",
  badge: "Most Popular",
  features: [
    "Unlimited events & internships",
    "Advanced filters (company size, industry, remote)",
    "Early access to new features",
    "Submit your own events",
    "Ride & Stay coordinator across all events",
    "Priority support",
  ],
  cta: "Start Meow+",
  ctaHref: "/auth/signin",
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
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

export default function Pricing() {
  return (
    <section className="py-32 px-4 relative overflow-hidden">
      {/* Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)", filter: "blur(40px)" }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <span className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full border border-purple/40 text-purple-light mb-5"
              style={{ background: "rgba(124,58,237,0.1)" }}>
              Pricing
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-5 tracking-tight"
          >
            Simple, honest{" "}
            <span className="gradient-text">pricing.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-lg text-text-secondary max-w-xl mx-auto"
          >
            Start free and upgrade when you need more. No tricks, no dark patterns.
          </motion.p>
        </div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >
          {/* Free tier */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
          >
            <div className="rounded-3xl border border-white/[0.06] p-2 bg-white/[0.02] h-full">
              <div className="bg-bg-card rounded-[calc(1.5rem-0.5rem)] p-7 h-full flex flex-col">
                <div className="mb-6">
                  <span className="text-sm font-semibold text-text-secondary tracking-wide">{freeTier.name}</span>
                  <div className="flex items-baseline gap-2 mt-2 mb-1">
                    <span className="font-display text-4xl font-bold text-text-primary">{freeTier.price}</span>
                    <span className="text-text-muted text-sm">{freeTier.period}</span>
                  </div>
                  <p className="text-sm text-text-muted">{freeTier.description}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {freeTier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(139,139,167,0.1)" }}>
                        <Check size={11} strokeWidth={2.5} className="text-text-secondary" />
                      </div>
                      <span className="text-sm text-text-secondary">{f}</span>
                    </li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={freeTier.ctaHref}
                    className="w-full block text-center py-3.5 rounded-full text-sm font-semibold text-text-secondary border border-white/[0.1] hover:border-white/[0.2] hover:text-text-primary transition-all duration-300"
                  >
                    {freeTier.cta}
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Meow+ */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
            className="relative"
          >
            {/* Gradient border glow */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(236,72,153,0.5))",
                padding: "1px",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ boxShadow: "0 0 48px rgba(124,58,237,0.25), 0 0 80px rgba(236,72,153,0.1)" }}
            />

            <div className="rounded-3xl p-2 h-full relative" style={{ background: "rgba(124,58,237,0.06)" }}>
              <div className="rounded-[calc(1.5rem-0.5rem)] p-7 h-full flex flex-col relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(13,13,31,0.8) 50%, rgba(236,72,153,0.08) 100%)", backdropFilter: "blur(12px)" }}>

                {/* Inner glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.25), transparent)", filter: "blur(16px)" }} />

                {/* Badge */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display text-sm font-bold text-text-primary tracking-wide">{proPlan.name}</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide text-white"
                        style={{ background: "var(--gradient-brand)" }}>
                        <Zap size={9} strokeWidth={2.5} />
                        {proPlan.badge}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1 mb-1">
                      <span className="font-display text-4xl font-bold text-text-primary">{proPlan.price}</span>
                      <span className="text-text-muted text-sm">{proPlan.period}</span>
                    </div>
                    <p className="text-xs text-purple-light">{proPlan.yearlyNote}</p>
                  </div>
                </div>

                <p className="text-sm text-text-secondary mb-6">{proPlan.description}</p>

                <ul className="space-y-3 flex-1 mb-8">
                  {proPlan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
                        <Check size={11} strokeWidth={2.5} className="text-purple-light" />
                      </div>
                      <span className="text-sm text-text-primary">{f}</span>
                    </li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={proPlan.ctaHref}
                    className="w-full block text-center py-3.5 rounded-full text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] transition-shadow duration-300"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    {proPlan.cta}
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Fine print */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-sm text-text-muted mt-10"
        >
          No credit card required to start. Cancel Meow+ anytime.
        </motion.p>
      </div>
    </section>
  )
}
