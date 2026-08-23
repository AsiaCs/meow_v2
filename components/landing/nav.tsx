"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { List, X } from "@phosphor-icons/react"
import { MeowWordmark } from "@/components/brand/meow-wordmark"

// ── Nav ─────────────────────────────────────────────────────────────────────
//
// Was a floating rounded capsule with a permanent border. Now a plain
// full-width bar that gains a hairline and a veil ONLY once the page has
// scrolled — depth doing a job (separating chrome from content that has moved
// under it) rather than sitting there as ambient decoration.
//
// Icons: two, from one library, at one weight. The previous nav pulled raw
// Lucide defaults; the rebuild uses a curated Phosphor subset.

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/internships", label: "Internships" },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8)
        frame = 0
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // Lock the page while the mobile sheet is open, and restore on unmount so a
  // route change mid-animation cannot strand the scroll lock.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-bg-veil backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <nav className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-8 px-6">
        <Link href="/" aria-label="meow — home" className="shrink-0">
          <MeowWordmark size={22} />
        </Link>

        <div className="ml-auto hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="link-underline text-body-m text-text-secondary transition-colors hover:text-text-primary"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/auth/signin"
            className="rounded-full bg-brand px-5 py-2 text-body-m font-medium text-on-brand transition-colors hover:bg-brand-hi"
          >
            Sign in
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          // 44px target — HIG's minimum for touch.
          className="ml-auto flex h-11 w-11 items-center justify-center text-text-secondary md:hidden"
        >
          {open ? <X size={22} weight="regular" /> : <List size={22} weight="regular" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -8 }}
            transition={{ type: "spring", bounce: 0.1, visualDuration: 0.32 }}
            className="border-b border-border bg-bg-surface px-6 pb-6 pt-2 md:hidden"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-border py-4 text-body-l text-text-primary"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/auth/signin"
              onClick={() => setOpen(false)}
              className="mt-6 block rounded-full bg-brand px-5 py-3 text-center text-body-m font-medium text-on-brand"
            >
              Sign in
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
