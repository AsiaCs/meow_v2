"use client"

import { motion, useReducedMotion } from "framer-motion"
import { MapPin, WifiHigh, Clock, ArrowSquareOut, CurrencyDollar } from "@phosphor-icons/react"
import { Badge, type BadgeVariant } from "@/components/ui/badge"
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

// A match score is a measurement, so the badge reflects how good the match is.
// The middle band used to be "purple", a colour name that told a reader nothing
// about what it meant.
function getMatchBadgeVariant(score: number): BadgeVariant {
  if (score >= 80) return "positive"
  if (score >= 60) return "accent"
  return "neutral"
}

function getDaysUntilDeadline(deadline: Date | string): number {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline
  const diff = d.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

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
  const reduced = useReducedMotion()
  const daysLeft = deadline ? getDaysUntilDeadline(deadline) : null
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
  const isPast = daysLeft !== null && daysLeft < 0
  const safeApplicationUrl = safeExternalUrl(applicationUrl)
  const canApply = Boolean(safeApplicationUrl && isSpecificApplyUrl(safeApplicationUrl) && !isPast)

  return (
    <motion.div
      // The card entrance and hover lift are decorative, so they collapse
      // under Reduce Motion. The CSS backstop in globals.css cannot reach a
      // framer-motion transform, so this has to branch on the query itself.
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduced ? undefined : { y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="rounded-panel h-full border border-border-subtle bg-bg-raised"
    >
      <div className="rounded-panel overflow-hidden flex flex-col h-full p-5 gap-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-11 h-11 rounded-control overflow-hidden bg-bg-raised border border-border-default flex items-center justify-center">
            {companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyLogo}
                alt=""
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="text-lead font-semibold text-text-secondary" aria-hidden="true">
                {company.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-meta font-medium text-text-muted">{company}</p>
            <h3 className="text-body font-semibold leading-snug text-text-primary mt-0.5 line-clamp-2">
              {title}
            </h3>
          </div>

          {matchScore !== undefined && matchScore > 0 && (
            <Badge variant={getMatchBadgeVariant(matchScore)} className="flex-shrink-0 tabular-nums">
              {matchScore}% match
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isRemote ? (
            <Badge variant="neutral">
              <WifiHigh size={12} weight="regular" aria-hidden="true" />
              Remote
            </Badge>
          ) : location ? (
            <div className="flex items-center gap-1 text-meta text-text-muted">
              <MapPin size={12} weight="regular" aria-hidden="true" />
              <span>{location}</span>
            </div>
          ) : null}

          {isPaid !== undefined && (
            <Badge variant={isPaid ? "positive" : "neutral"}>
              <CurrencyDollar size={12} weight="regular" aria-hidden="true" />
              {isPaid ? (salary ?? "Paid") : "Unpaid"}
            </Badge>
          )}
        </div>

        {/* Tags are metadata with no state attached, so they all take the
            neutral variant. Cycling them through four colours made an
            arbitrary word look semantically significant. */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="neutral">+{tags.length - 3}</Badge>
            )}
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border-subtle">
          <div>
            {deadline && !isPast && (
              <div className={cn("flex items-center gap-1 text-meta", isUrgent ? "text-critical" : "text-text-muted")}>
                <Clock size={12} weight="regular" aria-hidden="true" />
                {isUrgent ? (
                  <span className="font-semibold tabular-nums">
                    {daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                  </span>
                ) : (
                  <span className="tabular-nums">Due {formatDateShort(deadline)}</span>
                )}
              </div>
            )}
            {isPast && <Badge variant="critical">Closed</Badge>}
          </div>

          {canApply && safeApplicationUrl ? (
            <a
              href={safeApplicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-control"
            >
              <Button variant="primary" size="sm" tabIndex={-1}>
                Apply
                <ArrowSquareOut size={13} weight="bold" aria-hidden="true" />
                <span className="sr-only">opens in a new tab</span>
              </Button>
            </a>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              No apply link
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
