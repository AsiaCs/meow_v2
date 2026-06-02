import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// All format helpers pin to the BROWSER's resolved timezone so a UTC ISO
// string from Postgres ("2026-06-02T07:00:00Z") never accidentally drifts a
// day backward / forward for users west of UTC. The Intl resolved option
// makes the conversion explicit instead of relying on the runtime default.
const LOCAL_TZ =
  typeof Intl !== "undefined" && Intl.DateTimeFormat
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : undefined

export function formatToLocalDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: LOCAL_TZ,
  })
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: LOCAL_TZ,
  })
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: LOCAL_TZ,
  })
}

export function isUpcoming(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date
  return d > new Date()
}

// ---- Day-window helpers ----------------------------------------------------
//
// When a user clicks "June 2" on the calendar, the filter has to admit every
// event between local 00:00:00 and 23:59:59.999 on June 2 in THEIR timezone.
// A naive .getDate() comparison works for most rows but breaks across the
// DST spring-forward / fall-back boundary and on rows stored in a different
// offset. Computing explicit start/end timestamps is bulletproof.

export function localDayStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function localDayEnd(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/** True when `eventDate` falls inside the user's local calendar day of `day`. */
export function isOnLocalDay(eventDate: Date | string, day: Date): boolean {
  const e = typeof eventDate === "string" ? new Date(eventDate) : eventDate
  const start = localDayStart(day).getTime()
  const end = localDayEnd(day).getTime()
  const t = e.getTime()
  return t >= start && t <= end
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + "…"
}

export const INTEREST_AREAS = [
  "Software Engineering",
  "Product Management",
  "Design",
  "Finance",
  "Consulting",
  "Marketing",
  "Data Science",
  "Machine Learning / AI",
  "Entrepreneurship",
  "Law",
  "Medicine",
  "Operations",
  "Sales",
  "Real Estate",
  "Investing",
] as const

export type InterestArea = (typeof INTEREST_AREAS)[number]
