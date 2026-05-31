// meow — Ear Glyph (v2 brand mark)
//
// Source: claude.ai/design handoff "meow Logo Handoff.html".
// Construction: single open path, rounded caps + joins, rainbow gradient
// stroke + outer glow on a 1024×1024 squircle (236px corner radius).
//
// IDs are namespaced per instance via `useId()` so multiple logos on the
// same page (sidebar + lockup + favicon-ish helpers) don't collide on
// `mw-bg`, `mw-rainbow`, etc.

"use client"

import { useId } from "react"

export type MeowLogoTone = "dark" | "light"

interface MeowLogoProps {
  size?: number
  tone?: MeowLogoTone
  className?: string
  glow?: boolean       // soft drop-shadow under the icon (only meaningful on light surfaces)
  title?: string
}

const EAR_PATH =
  "M38 132 C38 84 43 72 52 28 C53 23 59 23 63 31 C73 53 85 66 100 66 " +
  "C115 66 127 53 137 31 C141 23 147 23 148 28 C157 72 162 84 162 132"

export function MeowLogo({
  size = 40,
  tone = "dark",
  className,
  glow = false,
  title = "meow",
}: MeowLogoProps) {
  const uid = useId().replace(/[:]/g, "")     // useId returns ":r0:" — strip the colons
  const id = (name: string) => `${uid}-${name}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={className}
      style={glow ? { filter: "drop-shadow(0 18px 36px rgba(110,50,190,0.45))" } : undefined}
    >
      <defs>
        {tone === "dark" ? (
          <radialGradient id={id("bg")} cx="0.5" cy="0.36" r="0.9">
            <stop offset="0" stopColor="#1b1533" />
            <stop offset="0.55" stopColor="#0d0b18" />
            <stop offset="1" stopColor="#060509" />
          </radialGradient>
        ) : (
          <radialGradient id={id("bg")} cx="0.5" cy="0.32" r="0.95">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.6" stopColor="#f3eefe" />
            <stop offset="1" stopColor="#e4dcf6" />
          </radialGradient>
        )}

        <radialGradient id={id("aura")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#6d28d9" stopOpacity="0.18" />
          <stop offset="1" stopColor="#6d28d9" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={id("rainbow")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="0.26" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="0.72" stopColor="#a855f7" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>

        <linearGradient id={id("rim")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.18" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id={id("glow")} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>

      {/* Squircle container */}
      <rect x="6" y="6" width="1012" height="1012" rx="236" fill={`url(#${id("bg")})`} />

      {/* Inner aura (dark only — the violet halo behind the glyph) */}
      {tone === "dark" && (
        <ellipse cx="512" cy="540" rx="360" ry="360" fill={`url(#${id("aura")})`} />
      )}

      {/* The Ear Glyph — wide blurred underlay + crisp stroke on top */}
      <g transform="translate(206 214) scale(3.05)">
        <path
          d={EAR_PATH}
          fill="none"
          stroke={`url(#${id("rainbow")})`}
          strokeWidth="17"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#${id("glow")})`}
          opacity="0.7"
        />
        <path
          d={EAR_PATH}
          fill="none"
          stroke={`url(#${id("rainbow")})`}
          strokeWidth="11"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>

      {/* Rim highlight */}
      <rect
        x="6" y="6" width="1012" height="1012" rx="236"
        fill="none"
        stroke={`url(#${id("rim")})`}
        strokeWidth="3"
        opacity={tone === "dark" ? 0.9 : 0.4}
      />

      {/* Top-sheen panel (dark only) */}
      {tone === "dark" && (
        <rect x="22" y="20" width="980" height="430" rx="220" fill={`url(#${id("rim")})`} opacity="0.06" />
      )}
    </svg>
  )
}
