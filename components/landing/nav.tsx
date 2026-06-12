"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { MeowLockup } from "@/components/brand/meow-lockup"

const links = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Internships", href: "/internships" },
]

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] } },
}

const linkContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

const linkVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

export default function LandingNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
        <motion.nav
          initial={{ opacity: 0, y: -16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center px-3 py-1.5 mr-1">
            <MeowLockup iconSize={22} wordmarkSize={18} gap={8} />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA — Mobbin pattern: solid monochrome pill, no gradient, no glow. */}
          <div className="hidden md:flex ml-2">
            <Link
              href="/auth/signin"
              className="
                inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                text-sm font-semibold
                bg-text-primary text-bg-base
                hover:bg-text-primary/90
                transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
              "
            >
              Get Started
              <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden ml-2 p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={18} strokeWidth={1.5} />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={18} strokeWidth={1.5} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.nav>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 md:hidden flex flex-col items-center justify-center bg-bg-base/95 backdrop-blur-2xl"
          >
            <motion.div
              variants={linkContainerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center gap-2"
            >
              {links.map((link) => (
                <motion.div key={link.href} variants={linkVariants}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block px-8 py-4 text-3xl font-display font-semibold text-text-secondary hover:text-text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div variants={linkVariants} className="mt-6">
                <Link
                  href="/auth/signin"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-semibold bg-text-primary text-bg-base hover:bg-text-primary/90 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                >
                  Get Started <span aria-hidden>→</span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
