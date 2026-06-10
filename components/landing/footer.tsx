"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { MeowLockup } from "@/components/brand/meow-lockup"

const navLinks = [
  { label: "Events", href: "/events" },
  { label: "Internships", href: "/internships" },
  { label: "Submit Event", href: "/submit" },
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
            <Link href="/" className="inline-flex items-center">
              <MeowLockup iconSize={32} wordmarkSize={24} gap={10} />
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
