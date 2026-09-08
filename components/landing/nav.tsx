"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { List, X } from "@phosphor-icons/react"
import { MeowWordmark } from "@/components/brand/meow-wordmark"

// ── Nav ─────────────────────────────────────────────────────────────────────
//
// Matches the reference: a slim bar inset from the page edges, carrying a
// hairline rather than a heavy border, with the links left of centre and the
// pair of actions hard right. The primary CTA lives here rather than in the
// hero, which is why the hero below is headline, trust row and visual only.
//
// The scroll state is an IntersectionObserver on a sentinel, carried forward
// from the previous system. It replaced a window scroll listener so none of
// our code runs on the scroll thread.

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/internships", label: "Internships" },
  { href: "#week", label: "This week" },
  { href: "#coverage", label: "Coverage" },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    )
    io.observe(sentinel)
    return () => io.disconnect()
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
    <>
      <div ref={sentinelRef} aria-hidden="true" className="absolute top-4 h-px w-full" />

      <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="mx-auto w-full max-w-[1180px]">
          <nav
            className={[
              "flex h-[52px] items-center gap-8 rounded-panel border px-4 transition-colors duration-200",
              scrolled
                ? "border-border-subtle bg-bg-veil backdrop-blur-md"
                : "border-border-subtle bg-bg-base",
            ].join(" ")}
          >
            <Link href="/" aria-label="meow, home" className="shrink-0 pl-1">
              <MeowWordmark size={19} />
            </Link>

            <div className="hidden items-center gap-7 md:flex">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-ui text-text-secondary transition-colors hover:text-text-primary"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="ml-auto hidden items-center gap-2 md:flex">
              <Link href="/auth/signin" className="btn btn-ghost text-text-secondary">
                Log in
              </Link>
              <Link href="/events" className="btn btn-primary">
                Browse events
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="ml-auto flex h-11 w-11 items-center justify-center text-text-secondary md:hidden"
            >
              {open ? <X size={20} weight="regular" /> : <List size={20} weight="regular" />}
            </button>
          </nav>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={reduced ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                className="mt-2 rounded-panel border border-border-subtle bg-bg-base p-2 md:hidden"
              >
                {LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-control px-3 py-3 text-body text-text-primary hover:bg-bg-raised"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="mt-1 flex flex-col gap-2 border-t border-border-subtle p-1 pt-3">
                  <Link
                    href="/auth/signin"
                    onClick={() => setOpen(false)}
                    className="btn btn-ghost w-full"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/events"
                    onClick={() => setOpen(false)}
                    className="btn btn-primary w-full"
                  >
                    Browse events
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  )
}
