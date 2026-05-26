"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { X } from "lucide-react"

const navLinks = [
  { label: "Events", href: "/events" },
  { label: "Internships", href: "/internships" },
  { label: "Submit Event", href: "/submit" },
]

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

const socialLinks = [
  {
    label: "Twitter / X",
    href: "https://twitter.com",
    icon: X,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: LinkedInIcon,
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10"
        >
          {/* Logo + tagline */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--gradient-brand)" }}>
                <span className="text-white text-sm font-bold leading-none">M</span>
              </div>
              <span className="font-display text-xl font-bold text-text-primary tracking-tight">meow</span>
            </Link>
            <p className="text-sm text-text-muted max-w-xs leading-relaxed">
              Find your next opportunity. Make connections that matter.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <motion.a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-white/[0.16] transition-all duration-200"
              >
                <Icon size={16} strokeWidth={1.5} />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Divider + copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Meow. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-muted">Made for builders, by builders</span>
            <span className="text-xs text-purple-light ml-1">✦</span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
