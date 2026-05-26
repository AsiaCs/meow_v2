"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, Star, ArrowRight, ExternalLink, Globe } from "lucide-react"

function GithubIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.02 0 0 .97-.31 3.18 1.18A11.07 11.07 0 0 1 12 6.81c.98.01 1.98.13 2.91.39 2.21-1.49 3.18-1.18 3.18-1.18.62 1.57.23 2.73.11 3.02.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}
import { Badge } from "@/components/ui/badge"

interface PersonCardProps {
  id: string
  name: string
  image?: string
  role?: string
  location?: string
  interests: string[]
  bio?: string
  isMentor?: boolean
  // Proof-of-Build link (replaces LinkedIn entirely)
  buildUrl?: string | null
  buildKind?: "github" | "portfolio" | null
  buildVerified?: boolean
}

const tagVariants: Array<"purple" | "pink" | "green" | "gray"> = [
  "purple",
  "pink",
  "green",
  "gray",
]

function Avatar({ name, image, verified }: { name: string; image?: string; verified: boolean }) {
  const ring = verified
    ? // neon green: clear "this person ships" signal
      "ring-2 ring-[#10b981] ring-offset-2 ring-offset-bg-card shadow-[0_0_18px_rgba(16,185,129,0.45)]"
    : ""

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className={`w-10 h-10 rounded-xl object-cover flex-shrink-0 ${ring}`}
      />
    )
  }
  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0 ${ring}`}
      style={{ background: "var(--gradient-brand)" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function PersonCard({
  id,
  name,
  image,
  location,
  interests,
  isMentor,
  buildUrl,
  buildKind,
  buildVerified,
}: PersonCardProps) {
  const hasBuild = !!buildUrl
  const buildLabel = buildKind === "github" ? "View GitHub" : "View Build"

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="border border-white/[0.06] rounded-3xl p-1.5 bg-white/[0.02] h-full"
    >
      <div className="bg-bg-card rounded-[calc(1.5rem-0.375rem)] overflow-hidden flex flex-col h-full p-5 gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar name={name} image={image} verified={!!buildVerified} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-text-primary font-semibold text-sm leading-tight truncate">
                {name}
              </h3>
              {isMentor && (
                <Star
                  size={13}
                  strokeWidth={1.5}
                  className="text-yellow-400 flex-shrink-0 fill-yellow-400"
                />
              )}
              {buildVerified && (
                <span
                  title="Connected GitHub"
                  aria-label="Verified GitHub"
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#10b981] text-bg-card flex-shrink-0"
                >
                  <GithubIcon size={9} />
                </span>
              )}
            </div>
            {location && (
              <div className="flex items-center gap-1 text-[11px] text-text-muted mt-1">
                <MapPin size={11} strokeWidth={1.5} />
                {location}
              </div>
            )}
          </div>
          {isMentor && (
            <Badge variant="purple" className="flex-shrink-0 text-[11px]">
              Mentor
            </Badge>
          )}
        </div>

        {/* Interests */}
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {interests.slice(0, 3).map((interest, i) => (
              <Badge key={interest} variant={tagVariants[i % tagVariants.length]}>
                {interest}
              </Badge>
            ))}
            {interests.length > 3 && (
              <Badge variant="gray">+{interests.length - 3}</Badge>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* CTAs */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
          <Link
            href={`/people/${id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-purple-light hover:text-purple transition-colors"
          >
            View Profile
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
          {hasBuild ? (
            <a
              href={buildUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={
                buildVerified
                  ? "inline-flex items-center gap-1.5 text-xs font-medium text-[#10b981] hover:brightness-110 transition-all"
                  : "inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
              }
              aria-label={buildLabel}
            >
              {buildKind === "github" ? (
                <GithubIcon size={12} />
              ) : (
                <Globe size={12} strokeWidth={1.75} />
              )}
              {buildLabel}
              <ExternalLink size={10} strokeWidth={1.75} className="opacity-60" />
            </a>
          ) : (
            <span className="text-[11px] text-text-muted italic">No build linked</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
