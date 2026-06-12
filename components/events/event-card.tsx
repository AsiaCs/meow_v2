"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Monitor, Clock, Navigation } from "lucide-react"
import { formatMiles } from "@/lib/geo/haversine"
import { DateThumb } from "./date-thumb"

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
  const showImage = imageUrl && !imgFailed

  return (
    <Link
      href={`/events/${id}`}
      className="
        group relative flex items-stretch gap-4 p-4
        rounded-2xl border border-border-subtle bg-bg-card
        shadow-[var(--shadow-card)]
        transition-[transform,box-shadow,border-color] duration-300
        ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-0.5 hover:border-border-strong
        hover:shadow-[var(--shadow-card-hover)]
        focus-visible:-translate-y-0.5
      "
    >
      {/* Thumbnail */}
      <div
        className={`
          w-[88px] h-[88px] sm:w-[112px] sm:h-[112px]
          rounded-xl overflow-hidden flex-shrink-0
          ${showImage ? "border border-border-subtle" : ""}
        `}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            onError={() => setImgFailed(true)}
            loading="lazy"
          />
        ) : (
          <DateThumb startDate={startDate} title={title} className="rounded-xl" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        {/* Time eyebrow */}
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-text-muted font-medium">
          <Clock size={11} strokeWidth={1.75} />
          {formatTime(startDate)}
        </div>

        {/* Title */}
        <h3
          className="
            font-display text-text-primary font-semibold
            text-[15px] sm:text-[16px] leading-snug line-clamp-2
            transition-colors duration-300
            group-hover:text-purple-light
          "
          style={{ letterSpacing: "-0.01em" }}
        >
          {title}
        </h3>

        {/* Meta row — monochrome by default, distance is the only accent */}
        <div className="flex items-center gap-x-3 gap-y-1 text-xs text-text-secondary flex-wrap mt-0.5">
          {isVirtual ? (
            <span className="inline-flex items-center gap-1.5">
              <Monitor size={12} strokeWidth={1.5} />
              Virtual
            </span>
          ) : location ? (
            <span className="inline-flex items-center gap-1.5 truncate max-w-[220px]">
              <MapPin size={12} strokeWidth={1.5} className="flex-shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          ) : null}

          {!isVirtual && typeof distanceMi === "number" && (
            <span className="inline-flex items-center gap-1.5 text-purple-light/90">
              <Navigation size={11} strokeWidth={1.75} />
              {formatMiles(distanceMi)} away
            </span>
          )}

          {/* Source — uniform monochrome pill outline, no colored fill */}
          <span
            className="
              inline-flex items-center rounded-full
              px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.14em]
              text-text-muted border border-border-subtle
              transition-colors duration-300
              group-hover:text-text-secondary group-hover:border-border-strong
            "
          >
            {getSourceLabel(source)}
          </span>
        </div>
      </div>
    </Link>
  )
}
