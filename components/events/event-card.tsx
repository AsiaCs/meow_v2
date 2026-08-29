"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, Users, MapPin, Monitor, Navigation } from "lucide-react"
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
  /** Distance from the viewing user in miles, if known. Rendered as "1.2 mi away". */
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

function formatTimeRow(date: Date | string): string {
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

// Compact 100x100 ink cover for the horizontal list row. Image when available,
// otherwise the #1A102F ink plate with spaced MONTH over a smaller day numeral.
function InkCover({
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
  if (imageUrl && !failed) {
    return (
      <div className="w-[100px] h-[100px] rounded-xl overflow-hidden flex-shrink-0 border border-border relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={onError}
          loading="lazy"
        />
      </div>
    )
  }

  // No source image — flat panel with the date, no gradient (shadow-card
  // and gradient-brand are both `none` in the token set).
  return (
    <div className="w-[100px] h-[100px] rounded-xl overflow-hidden flex-shrink-0 flex flex-col items-center justify-center border border-border bg-bg-panel">
      <span
        className="font-bold uppercase text-text-muted"
        style={{ fontSize: "9px", letterSpacing: "0.32em" }}
      >
        {mo}
      </span>
      <span
        className="font-display font-extrabold text-text-primary leading-none mt-0.5"
        style={{ fontSize: "32px", letterSpacing: "-0.04em" }}
      >
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
        group flex items-stretch gap-4 p-3 rounded-[18px] border border-border bg-bg-card
        transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-0.5 hover:border-border-strong
      "
    >
      <InkCover
        imageUrl={imageUrl}
        failed={imgFailed}
        onError={() => setImgFailed(true)}
        mo={mo}
        day={day}
      />

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        {/* Time eyebrow + source */}
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-text-muted font-semibold">
          <Clock size={12} strokeWidth={1.8} />
          {formatTimeRow(startDate)}
          <span className="text-text-faint">·</span>
          <span className="text-text-secondary tracking-[0.16em]">{getSourceLabel(source)}</span>
        </div>

        {/* Title */}
        <h3
          className="font-display font-bold text-[16px] sm:text-[17px] leading-[1.18] text-text-primary group-hover:text-brand transition-colors line-clamp-2"
          style={{ letterSpacing: "-0.015em" }}
        >
          {title}
        </h3>

        {/* Location + distance */}
        <div className="flex items-center gap-3 text-[12.5px] text-text-secondary font-medium flex-wrap">
          {isVirtual ? (
            <span className="inline-flex items-center gap-1.5">
              <Monitor size={12} strokeWidth={1.8} />
              Virtual
            </span>
          ) : location ? (
            <span className="inline-flex items-center gap-1.5 truncate max-w-[260px]">
              <MapPin size={12} strokeWidth={1.8} className="flex-shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          ) : null}

          {!isVirtual && typeof distanceMi === "number" && (
            <span className="inline-flex items-center gap-1.5 text-brand font-semibold">
              <Navigation size={11} strokeWidth={1.9} />
              {formatMiles(distanceMi)} away
            </span>
          )}
        </div>
      </div>

      {/* Going-count column on wider rows */}
      <div className="hidden sm:flex flex-col items-end justify-center pr-2 text-text-muted">
        <Users size={14} strokeWidth={1.7} />
      </div>
    </Link>
  )
}
