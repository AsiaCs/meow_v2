// URL helpers used by people / events / internships UI to safely render
// external links. Every helper either returns a valid URL or null — callers
// must check and render a disabled state when null.

const URL_PROTOCOL_REGEX = /^https?:\/\//i

export function safeExternalUrl(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null
  if (!URL_PROTOCOL_REGEX.test(trimmed)) return null
  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname.length < 3) return null
    return parsed.toString()
  } catch {
    return null
  }
}

// Build a LinkedIn People-search URL for a given name. Guaranteed to land on a
// real LinkedIn page — worst case the search returns "no results" rather than
// a 404. Use this as a fallback when a verified profile URL is not available.
export function buildLinkedInSearchUrl(name: string | null | undefined): string | null {
  if (!name) return null
  const cleaned = name.trim()
  if (!cleaned) return null
  const params = new URLSearchParams({
    keywords: cleaned,
    origin: "GLOBAL_SEARCH_HEADER",
  })
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`
}

// Strict whitelist for "this is a real linkedin.com/in/{slug} profile URL".
// We can NOT verify the slug actually resolves because LinkedIn blocks
// server-side HEAD requests — so this is only a syntactic check. Callers
// should still treat unverified profile URLs with caution and prefer the
// search fallback unless they have a separate verification signal.
export function isLinkedInProfileFormat(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const { hostname, pathname } = new URL(url)
    return (
      (hostname === "linkedin.com" || hostname === "www.linkedin.com") &&
      pathname.startsWith("/in/") &&
      pathname.length > 5
    )
  } catch {
    return false
  }
}
