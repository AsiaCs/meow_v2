"use client"

import { motion } from "framer-motion"
import { MapPin, Monitor, ExternalLink, CalendarDays, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatDateShort } from "@/lib/utils"

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
  luma: "Luma",
  community: "Community",
  user: "Community",
  scraped: "Curated",
}

function getSourceLabel(source: string) {
  return SOURCE_LABELS[source.toLowerCase()] ?? source
}

const tagVariants: Array<"purple" | "pink" | "green" | "gray"> = [
  "purple",
  "pink",
  "green",
  "gray",
]

function tagVariant(index: number): "purple" | "pink" | "green" | "gray" {
  return tagVariants[index % tagVariants.length]
}

export function EventCard({
  title,
  description,
  startDate,
  location,
  isVirtual,
  registrationUrl,
  imageUrl,
  tags,
  isFree,
  source,
}: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="border border-white/[0.06] rounded-3xl p-1.5 bg-white/[0.02] h-full"
    >
      <div className="bg-bg-card rounded-[calc(1.5rem-0.375rem)] overflow-hidden flex flex-col h-full">
        {/* Image or gradient header */}
        {imageUrl ? (
          <div className="h-36 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="h-28 opacity-60"
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(236,72,153,0.2) 100%)",
            }}
          />
        )}

        <div className="flex flex-col flex-1 p-5 gap-3">
          {/* Tags row */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag, i) => (
                <Badge key={tag} variant={tagVariant(i)}>
                  <Tag size={10} className="mr-1 opacity-70" />
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="gray">+{tags.length - 3}</Badge>
              )}
            </div>
          )}

          {/* Date chip */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <CalendarDays size={13} strokeWidth={1.5} />
            <span className="font-medium">{formatDateShort(startDate)}</span>
          </div>

          {/* Title */}
          <h3 className="text-text-primary font-semibold text-base leading-snug line-clamp-2">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          {/* Location */}
          <div className="flex items-center gap-1.5">
            {isVirtual ? (
              <Badge variant="purple">
                <Monitor size={11} className="mr-1" />
                Virtual
              </Badge>
            ) : location ? (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <MapPin size={12} strokeWidth={1.5} />
                <span>{location}</span>
              </div>
            ) : null}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Badge variant={isFree ? "green" : "gray"}>
                {isFree ? "Free" : "Paid"}
              </Badge>
              <Badge variant="outline">{getSourceLabel(source)}</Badge>
            </div>
            <a
              href={registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="primary"
                size="sm"
                className="gap-1"
              >
                RSVP
                <ExternalLink size={12} strokeWidth={1.5} />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
