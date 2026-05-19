import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function isUpcoming(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date
  return d > new Date()
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
