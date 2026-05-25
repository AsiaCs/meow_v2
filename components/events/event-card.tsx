"use client"

import Link from "next/link"
import { MapPin, Monitor, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

function GradientThumb({ title }: { title: string }) {
  // Deterministic hue from title so the same event always gets the same color
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

export function EventCard({
  id,
  title,
  startDate,
  location,
  isVirtual,
  imageUrl,
  source,
}: EventCardProps) {
  return (
    <Link
      href={`/events/${id}`}
      className="group flex items-stretch gap-4 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors"
    >
      {/* Thumbnail (left) — Luma uses a square thumb, so we do too */}
      <div className="w-[88px] h-[88px] sm:w-[112px] sm:h-[112px] rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.06]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <GradientThumb title={title} />
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
          <Badge variant="gray" className="text-[10px] uppercase tracking-wider">
            {getSourceLabel(source)}
          </Badge>
        </div>
      </div>
    </Link>
  )
}
