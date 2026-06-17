"use client"

import { motion } from "framer-motion"
import { MapPin, Wifi, Clock, ExternalLink, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatDateShort } from "@/lib/utils"
import { safeExternalUrl } from "@/lib/url-helpers"
import { isSpecificApplyUrl } from "@/lib/validators/specific-urls"

interface InternshipCardProps {
  id: string
  title: string
  company: string
  companyLogo?: string
  location?: string
  isRemote: boolean
  deadline?: Date | string
  isPaid?: boolean
  salary?: string
  tags: string[]
  applicationUrl?: string | null
  matchScore?: number
}

function getMatchBadgeVariant(score: number): "green" | "purple" | "gray" {
  if (score >= 80) return "green"
  if (score >= 60) return "purple"
  return "gray"
}

function getDaysUntilDeadline(deadline: Date | string): number {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline
  const diff = d.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const tagVariants: Array<"purple" | "pink" | "green" | "gray"> = [
  "purple",
  "pink",
  "green",
  "gray",
]

export function InternshipCard({
  title,
  company,
  companyLogo,
  location,
  isRemote,
  deadline,
  isPaid,
  salary,
  tags,
  applicationUrl,
  matchScore,
}: InternshipCardProps) {
  const daysLeft = deadline ? getDaysUntilDeadline(deadline) : null
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
  const isPast = daysLeft !== null && daysLeft < 0
  const safeApplicationUrl = safeExternalUrl(applicationUrl)
  const canApply = Boolean(safeApplicationUrl && isSpecificApplyUrl(safeApplicationUrl) && !isPast)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="glass rounded-3xl h-full"
    >
      <div className="rounded-[24px] overflow-hidden flex flex-col h-full p-5 gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Company logo or initial */}
          <div className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-bg-elevated border border-border-strong flex items-center justify-center">
            {companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyLogo}
                alt={company}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="text-base font-bold text-text-secondary">
                {company.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted font-medium">{company}</p>
            <h3 className="text-text-primary font-semibold text-sm leading-snug mt-0.5 line-clamp-2">
              {title}
            </h3>
          </div>

          {/* Match score */}
          {matchScore !== undefined && matchScore > 0 && (
            <Badge variant={getMatchBadgeVariant(matchScore)} className="flex-shrink-0 text-[11px]">
              {matchScore}% Match
            </Badge>
          )}
        </div>

        {/* Location + paid */}
        <div className="flex items-center gap-2 flex-wrap">
          {isRemote ? (
            <Badge variant="purple">
              <Wifi size={11} className="mr-1" />
              Remote
            </Badge>
          ) : location ? (
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <MapPin size={12} strokeWidth={1.5} />
              <span>{location}</span>
            </div>
          ) : null}

          {isPaid !== undefined && (
            <Badge variant={isPaid ? "green" : "gray"}>
              <DollarSign size={11} className="mr-0.5" />
              {isPaid ? (salary ?? "Paid") : "Unpaid"}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag, i) => (
              <Badge key={tag} variant={tagVariants[i % tagVariants.length]}>
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="gray">+{tags.length - 3}</Badge>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* Deadline + apply */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div>
            {deadline && !isPast && (
              <div className={cn("flex items-center gap-1 text-xs", isUrgent ? "text-red-400" : "text-text-muted")}>
                <Clock size={12} strokeWidth={1.5} />
                {isUrgent ? (
                  <span className="font-semibold">
                    {daysLeft === 0 ? "Due today!" : `${daysLeft}d left`}
                  </span>
                ) : (
                  <span>Due {formatDateShort(deadline)}</span>
                )}
              </div>
            )}
            {isPast && (
              <Badge variant="gray">Closed</Badge>
            )}
          </div>

          {canApply && safeApplicationUrl ? (
            <a
              href={safeApplicationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="sm" className="gap-1">
                Apply Now
                <ExternalLink size={12} strokeWidth={1.5} />
              </Button>
            </a>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Apply unavailable
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
