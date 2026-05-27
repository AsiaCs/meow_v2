"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Monitor, Clock, Navigation } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatMiles } from "@/lib/geo/haversine"

interface EventCardProps {
  id: string
  title: string
  description?: string
  startDate: Date | string
  location?: string
  isVirtual: boolean
  registrationUrl?: string
  imageUrl?: string
  tags: string[]
  isFree: boolean
  source: string
  /** Distance from the viewing user in miles, if known. Rendered as "5.2 mi away". */
  distanceMi?: number | null
}

const SOURCE_LABELS: Record<string, string> = {
  "cerebral-valley": "Cerebral Valley",
  "Cerebral Valley": "Cerebral Valley",
  luma: "Luma",
  Luma: "Luma",
  community: "Community",
  user: "Community",
  scraped: "Curated",
}

function getSourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? SOURCE_LABELS[source.toLowerCase()] ?? source
}

function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

// Stylized date-block fallback for events with no cover image. Matches the
// app's dark-purple neon aesthetic: deep-violet base, glowing inner border,
// month abbreviation up top, day glyph below in a large heavy display font.
function DateThumb({ startDate, title }: { startDate: Date | string; title: string }) {
  const d = typeof startDate === "string" ? new Date(startDate) : startDate
  const valid = !isNaN(d.getTime())
  const month = valid ? d.toLocaleDateString("en-US", { month: "short" }).toUpperCase() : ""
  const day = valid ? d.getDate() : ""

  if (!valid) {
    // No date and no image — deterministic gradient based on title so each
    // event still gets a distinct visual fingerprint.
    let h = 0
    for (let i = 0; i < title.length; i++) h = ((h << 5) - h) + title.charCodeAt(i)
    const hue = Math.abs(h) % 360
    return (
      <div
        className="w-full h-full"
        style={{
          background: `linear-gradient(135deg, hsl(${hue},70%,55%) 0%, hsl(${(hue + 60) % 360},70%,45%) 100%)`,
        }}
      />
    )
  }

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center select-none"
      style={{
        background: "linear-gradient(160deg, #1A102F 0%, #0C0820 70%, #050310 100%)",
        // Inner neon-purple border for the glow rim
        boxShadow:
          "inset 0 0 0 1px rgba(168,85,247,0.45), inset 0 0 18px rgba(168,85,247,0.18), 0 0 24px rgba(168,85,247,0.08)",
      }}
    >
      {/* Subtle radial glow behind the numerals */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 55%, rgba(168,85,247,0.22), transparent 70%)",
        }}
      />
      <div className="relative font-display font-bold text-[10px] tracking-[0.18em] text-purple-light/85">
        {month}
      </div>
      <div
        className="relative font-display font-extrabold text-white leading-none mt-1"
        style={{
          fontSize: "2.25rem",
          textShadow: "0 0 14px rgba(168,85,247,0.55)",
        }}
      >
        {day}
      </div>
    </div>
  )
}

export function EventCard({
  id,
  title,
  startDate,
  location,
  isVirtual,
  imageUrl,
  source,
  distanceMi,
}: EventCardProps) {
  // Track image-load failure so a 404 cover URL also reveals the date block,
  // not just rows where imageUrl was null from the API.
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = imageUrl && !imgFailed

  return (
    <Link
      href={`/events/${id}`}
      className="group flex items-stretch gap-4 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors"
    >
      {/* Thumbnail (left) — Luma uses a square thumb, so we do too */}
      <div className="w-[88px] h-[88px] sm:w-[112px] sm:h-[112px] rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.06]">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
            loading="lazy"
          />
        ) : (
          <DateThumb startDate={startDate} title={title} />
        )}
      </div>

      {/* Content (right) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock size={12} strokeWidth={1.5} />
          {formatTime(startDate)}
        </div>

        {/* Title */}
        <h3 className="text-text-primary font-semibold text-[15px] leading-snug line-clamp-2 group-hover:text-purple-light transition-colors">
          {title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap">
          {isVirtual ? (
            <span className="inline-flex items-center gap-1">
              <Monitor size={12} strokeWidth={1.5} />
              Virtual
            </span>
          ) : location ? (
            <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
              <MapPin size={12} strokeWidth={1.5} className="flex-shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          ) : null}
          {!isVirtual && typeof distanceMi === "number" && (
            <span className="inline-flex items-center gap-1 text-purple-light font-medium">
              <Navigation size={11} strokeWidth={1.75} />
              {formatMiles(distanceMi)} away
            </span>
          )}
          <Badge variant="gray" className="text-[10px] uppercase tracking-wider">
            {getSourceLabel(source)}
          </Badge>
        </div>
      </div>
    </Link>
  )
}
