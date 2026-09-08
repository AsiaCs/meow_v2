"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, MapPin, Monitor, NavigationArrow } from "@phosphor-icons/react"
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

// Compact cover for the list row: the source image when there is one,
// otherwise a flat panel carrying the date. The date plate is not decoration
// standing in for a missing image, it is the single most useful thing about
// an event listing, so a row without an image loses nothing.
function DateCover({
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
      <div className="w-[100px] h-[100px] rounded-panel overflow-hidden flex-shrink-0 border border-border-subtle relative">
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

  return (
    <div className="w-[100px] h-[100px] rounded-panel overflow-hidden flex-shrink-0 flex flex-col items-center justify-center border border-border-subtle bg-bg-sunken">
      <span className="text-meta font-semibold uppercase tracking-[0.28em] text-text-muted">
        {mo}
      </span>
      <span className="font-display text-heading-l font-semibold tabular-nums text-text-primary leading-none mt-0.5">
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
        group flex items-stretch gap-4 p-3 rounded-panel border border-border-subtle bg-bg-raised
        transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-0.5 hover:border-border-default
      "
    >
      <DateCover
        imageUrl={imageUrl}
        failed={imgFailed}
        onError={() => setImgFailed(true)}
        mo={mo}
        day={day}
      />

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        {/* Time and source. One middot per line: the separator is rationed,
            so the source sits after a single divider rather than a chain. */}
        <div className="flex items-center gap-2 text-meta font-medium text-text-muted">
          <Clock size={13} weight="regular" aria-hidden="true" />
          <span className="tabular-nums">{formatTimeRow(startDate)}</span>
          <span className="text-text-secondary">{getSourceLabel(source)}</span>
        </div>

        <h3 className="font-display text-heading-m font-semibold text-text-primary transition-colors group-hover:text-accent line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center gap-3 text-body text-text-secondary flex-wrap">
          {isVirtual ? (
            <span className="inline-flex items-center gap-1.5">
              <Monitor size={13} weight="regular" aria-hidden="true" />
              Virtual
            </span>
          ) : location ? (
            <span className="inline-flex items-center gap-1.5 truncate max-w-[260px]">
              <MapPin size={13} weight="regular" className="flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{location}</span>
            </span>
          ) : null}

          {!isVirtual && typeof distanceMi === "number" && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
              <NavigationArrow size={12} weight="fill" aria-hidden="true" />
              {formatMiles(distanceMi)} away
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
