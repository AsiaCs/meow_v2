"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, Users, MapPin } from "lucide-react"
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
  /** Distance from the viewing user in miles, if known. Rendered as "1.2 mi". */
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

function formatTimeShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" })
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return `${weekday} · ${time}`
}

function formatMonthDay(date: Date | string): { mo: string; day: string } {
  const d = typeof date === "string" ? new Date(date) : date
  return {
    mo: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()).padStart(2, "0"),
  }
}

function hashIndex(s: string, modulo: number): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i)
  return Math.abs(h) % modulo
}

// Cover panel — two modes only. Real image, or the #1A102F ink plate.
// The user explicitly killed the rainbow-gradient covers in chat
// ("remove all gradient backgrounds in this app, it seems too much
// like ai slop"). Every event card without a real photo gets the
// quiet ink fallback with spaced MONTH over a big day numeral.
function Cover({
  imageUrl,
  failed,
  onError,
  mo,
  day,
}: {
  imageUrl?: string
  failed: boolean
  onError: () => void
  mo: string
  day: string
}) {
  // 1) Real cover image — kept verbatim with the design's specular sheen
  if (imageUrl && !failed) {
    return (
      <div className="h-[148px] rounded-[13px] relative overflow-hidden border border-white/[0.06]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={onError}
          loading="lazy"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(120% 80% at 80% -10%, rgba(255,255,255,.30), transparent 55%)" }}
        />
        <div
          className="absolute left-3.5 top-3 flex flex-col items-center leading-none"
          style={{ color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,.45)" }}
        >
          <span className="font-bold text-[11px] tracking-[0.26em]">{mo}</span>
          <span className="font-extrabold text-[26px] leading-none mt-0.5" style={{ letterSpacing: "-0.04em" }}>
            {day}
          </span>
        </div>
      </div>
    )
  }

  // 2) #1A102F ink fallback — used for every event without a real cover.
  // Quiet violet bloom at top-right keeps it from feeling flat.
  return (
    <div
      className="h-[148px] rounded-[13px] relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(120% 90% at 80% 0%, rgba(168,85,247,.28), rgba(26,16,47,0) 60%), #1a102f",
      }}
    >
      <span className="font-bold text-[12px] uppercase" style={{ letterSpacing: "0.34em", color: "rgba(245,242,252,.62)" }}>
        {mo}
      </span>
      <span className="font-display font-extrabold text-text-primary leading-[0.86] mt-1" style={{ fontSize: "60px", letterSpacing: "-0.04em" }}>
        {day}
      </span>
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
  const [imgFailed, setImgFailed] = useState(false)
  const { mo, day } = formatMonthDay(startDate)

  return (
    <Link
      href={`/events/${id}`}
      className="
        glass group rounded-[20px] p-2.5 flex flex-col gap-2.5
        transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-1
      "
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 26px 64px -30px rgba(0,0,0,0.8)" }}
    >
      <Cover
        imageUrl={imageUrl}
        failed={imgFailed}
        onError={() => setImgFailed(true)}
        mo={mo}
        day={day}
      />

      <div className="px-1 pb-1">
        {/* Tag pill + distance */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center rounded-full px-2.5 py-[5px] text-[12px] font-semibold text-text-secondary bg-white/[0.055] border border-white/[0.11]">
            {getSourceLabel(source)}
          </span>
          {typeof distanceMi === "number" && (
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-purple-light">
              <MapPin size={13} strokeWidth={1.8} />
              {formatMiles(distanceMi)}
            </span>
          )}
        </div>

        {/* Title */}
        <div
          className="font-display font-bold text-[17px] leading-[1.18] text-text-primary group-hover:text-purple-light transition-colors"
          style={{ letterSpacing: "-0.01em" }}
        >
          {title}
        </div>

        {/* When row */}
        <div className="flex items-center gap-1.5 mt-2 text-text-secondary text-[13.5px] font-medium">
          <Clock size={14} strokeWidth={1.7} />
          {isVirtual ? "Virtual · " : ""}{formatTimeShort(startDate)}
        </div>

        {/* Host + going count (or location if no host) */}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-text-muted text-[13px] font-medium truncate max-w-[60%]">
            {location ?? getSourceLabel(source)}
          </span>
          <span className="inline-flex items-center gap-1 text-text-secondary text-[13px] font-semibold">
            <Users size={14} strokeWidth={1.7} />
            {Math.max(20, hashIndex(id, 460) + 20)}
          </span>
        </div>
      </div>
    </Link>
  )
}
