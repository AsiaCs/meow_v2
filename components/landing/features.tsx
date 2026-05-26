"use client"

import { motion } from "framer-motion"
import { Briefcase, Calendar, CheckCircle2, MapPin, Link2, Bell, Search } from "lucide-react"

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
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
    icon: Briefcase,
    tag: "Internships",
    title: "Find the right internship",
    description:
      "Filtered by your location, interests, and experience level — so you only see what actually fits. Direct links to applications, no middleman.",
    gradient: "from-blue-500/20 to-purple/20",
    borderGlow: "rgba(59,130,246,0.3)",
    iconColor: "text-blue-400",
    tagColor: "#60a5fa",
    iconBg: "rgba(59,130,246,0.15)",
    bullets: [
      { icon: MapPin, text: "Filter by city, remote, or hybrid" },
      { icon: Search, text: "Interest-based matching" },
      { icon: Link2, text: "Direct application links" },
    ],
  },
  {
    icon: Calendar,
    tag: "Events",
    title: "Discover networking events",
    description:
      "Scraped from the top sources — Luma, Cerebral Valley, Eventbrite and more. Calendar view, RSVP links, everything in one place.",
    gradient: "from-purple/20 to-pink/20",
    borderGlow: "rgba(124,58,237,0.3)",
    iconColor: "text-purple-light",
    tagColor: "#9d5af5",
    iconBg: "rgba(124,58,237,0.15)",
    bullets: [
      { icon: Bell, text: "Aggregated from top event platforms" },
      { icon: Calendar, text: "Calendar view with reminders" },
      { icon: Link2, text: "One-click RSVP links" },
    ],
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const Icon = feature.icon
  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
      className="rounded-3xl border border-white/[0.06] p-2 bg-white/[0.02] flex-1 min-w-0"
    >
      <div className="bg-bg-card rounded-[calc(1.5rem-0.5rem)] p-6 h-full flex flex-col">
        {/* Icon + tag */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: feature.iconBg, border: `1px solid ${feature.borderGlow}` }}
          >
            <Icon size={20} strokeWidth={1.5} className={feature.iconColor} />
          </div>
          <div>
            <span
              className="inline-block text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full mb-1"
              style={{ color: feature.tagColor, background: feature.iconBg }}
            >
              {feature.tag}
            </span>
            <h3 className="font-display text-lg font-semibold text-text-primary leading-snug">
              {feature.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary leading-relaxed mb-6 flex-1">
          {feature.description}
        </p>

        {/* Bullet points */}
        <ul className="space-y-3">
          {feature.bullets.map((bullet, i) => {
            const BulletIcon = bullet.icon
            return (
              <li key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: feature.iconBg }}>
                  <BulletIcon size={12} strokeWidth={1.5} className={feature.iconColor} />
                </div>
                <span className="text-sm text-text-secondary">{bullet.text}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </motion.div>
  )
}

export default function Features() {
  return (
    <section className="py-32 px-4 relative">
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 40% at 50% 50%, rgba(124,58,237,0.06), transparent)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <span className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full border border-purple/40 text-purple-light mb-5"
              style={{ background: "rgba(124,58,237,0.1)" }}>
              Everything in one place
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-5 tracking-tight"
          >
            Three ways to grow.{" "}
            <span className="gradient-text">One platform.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-lg text-text-secondary max-w-xl mx-auto leading-relaxed"
          >
            Meow pulls together internships and events so you can spend less time searching and more time doing.
          </motion.p>
        </div>

        {/* Feature cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="flex flex-col md:flex-row gap-5"
        >
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </motion.div>

        {/* Source logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="mt-16 flex flex-col items-center gap-5"
        >
          <p className="text-xs text-text-muted tracking-widest uppercase font-medium">
            Data sourced from
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {sources.map((source) => (
              <span
                key={source}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-text-secondary border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:text-text-primary transition-all duration-200 cursor-default"
              >
                <CheckCircle2 size={12} strokeWidth={1.5} className="text-text-muted" />
                {source}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
