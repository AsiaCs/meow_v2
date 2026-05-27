// Free-form location string → structured location with coords.
//
// Examples:
//   "SHACK15, San Francisco"       → { venue: "SHACK15", city: "San Francisco", region: "Bay Area", state: "CA", country: "US", lat: 37.7749, lng: -122.4194 }
//   "Hacker House, Palo Alto"       → { venue: "Hacker House", city: "Palo Alto",      region: "Bay Area", state: "CA", ... }
//   "Chinatown, SF"                 → { venue: "Chinatown",    city: "San Francisco", region: "Bay Area", state: "CA", ... }
//   "Santa Monica, CA"              → { venue: null,           city: "Santa Monica",  region: "Los Angeles", state: "CA", ... }   <-- NOT Bay Area
//   "Datadog - Headquarters"        → { venue: "Datadog - Headquarters", city: null, ... }   <-- unclassifiable; venue only
//   "Remote" / "Virtual" / null     → null
//
// Strict invariant — see lib/geo/cities.ts for the ordered alias list:
//   • Palo Alto, San Jose, Berkeley, Mountain View all resolve to region: "Bay Area"
//   • Santa Monica, Pasadena, Venice, Hollywood resolve to region: "Los Angeles"
//   • No event in the Bay Area can be labeled "Los Angeles" or vice versa.

import { CITIES, type City } from "./cities"

export interface ParsedLocation {
  /** The free-form chunk before the city, if any (e.g. "SHACK15", "Hacker House"). */
  venue: string | null
  city: string | null
  region: City["region"] | null
  state: string | null
  country: string | null   // ISO alpha-2
  lat: number | null
  lng: number | null
  /** True when input was clearly virtual / online / remote */
  isVirtual: boolean
  /** Original input, normalized whitespace. Always kept so the UI can fall back. */
  raw: string
}

const VIRTUAL_RE = /\b(virtual|online|remote|zoom|livestream|live\s*stream)\b/i

export function parseLocation(input: string | null | undefined): ParsedLocation | null {
  if (!input) return null
  const raw = input.trim().replace(/\s+/g, " ")
  if (!raw) return null

  if (VIRTUAL_RE.test(raw)) {
    return {
      venue: null, city: null, region: null, state: null, country: null,
      lat: null, lng: null, isVirtual: true, raw,
    }
  }

  const lower = raw.toLowerCase()

  // Find the first city whose alias appears in the raw string. CITIES is
  // ordered most-specific-first so "palo alto" wins over a generic "ca",
  // and SoCal-only aliases never match a NorCal string.
  let matched: City | null = null
  let matchedAlias: string | null = null
  for (const city of CITIES) {
    for (const alias of city.aliases) {
      if (lower.includes(alias)) {
        matched = city
        matchedAlias = alias
        break
      }
    }
    if (matched) break
  }

  // Try to extract a venue: comma-separated chunk before the matched alias.
  let venue: string | null = null
  if (matched && matchedAlias) {
    const idx = lower.indexOf(matchedAlias)
    if (idx > 0) {
      const beforeRaw = raw.slice(0, idx).trim()
      const beforeClean = beforeRaw.replace(/[,\-–—|·]+\s*$/g, "").trim()
      if (beforeClean.length > 0 && beforeClean.length <= 80) {
        venue = beforeClean
      }
    }
  } else {
    // Unclassifiable as a known city — treat the whole string as a venue label
    if (raw.length <= 120) venue = raw
  }

  return {
    venue,
    city: matched?.label ?? null,
    region: matched?.region ?? null,
    state: matched?.state ?? null,
    country: matched?.country ?? null,
    lat: matched?.lat ?? null,
    lng: matched?.lng ?? null,
    isVirtual: false,
    raw,
  }
}

/** Convenience: just the human-readable display string for the parsed result. */
export function formatParsedLocation(p: ParsedLocation | null): string {
  if (!p) return ""
  if (p.isVirtual) return "Virtual"
  if (p.venue && p.city) return `${p.venue}, ${p.city}`
  if (p.city) return p.state ? `${p.city}, ${p.state}` : p.city
  if (p.venue) return p.venue
  return p.raw
}
