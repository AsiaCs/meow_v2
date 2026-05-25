// Shared helper: returns true only when the URL points at a SPECIFIC event /
// posting page that a user can actually RSVP or apply to. Generic discovery /
// listing / search pages get rejected.

const LUMA_NON_EVENT_PATHS = new Set([
  "", "/", "/discover", "/sf", "/nyc", "/la", "/boston", "/chicago",
  "/austin", "/seattle", "/dc", "/miami", "/london", "/toronto",
  "/berlin", "/singapore", "/denver", "/atlanta", "/about", "/pricing",
  "/calendar", "/home", "/explore",
])

// Path tokens that almost always mean "browse / search / discover", never a
// single specific event. Domain-agnostic safety net.
const GENERIC_PATH_TOKENS = [
  "/d/", "/search", "/discover", "/find/", "/browse",
  "/pro/", "/career_fairs", "/career-fairs", "/listings",
  "/categories/", "/category/", "/topics/", "/topic/",
  "/jobs/search", "/explore",
]

// Strict whitelist: only accept URLs we can positively identify as a specific
// single event page. Anything else is rejected so users never get dumped on a
// listing / homepage when they expected an RSVP page.
export function isSpecificEventUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const { hostname, pathname } = new URL(url)
    const path = pathname.replace(/\/$/, "")

    // Luma — anything that isn't a known discovery slug is a real event page
    if (hostname.endsWith("lu.ma") || hostname.endsWith("luma.com")) {
      if (LUMA_NON_EVENT_PATHS.has(path)) return false
      // Path must have a body (e.g. /cerebral-valley-happy-hour, /e/{id})
      // and not be one of the generic discovery tokens
      if (path.length < 2) return false
      for (const tok of GENERIC_PATH_TOKENS) {
        if (path.toLowerCase().includes(tok)) return false
      }
      return true
    }

    // Cerebral Valley — accept /e/<slug> (canonical event URL the CV API
    // returns) or /events/<slug>. Reject the /events index page itself.
    if (hostname.endsWith("cerebralvalley.ai")) {
      return /^\/e\/[^/]+/.test(path) || /^\/events\/[^/]+/.test(path)
    }

    // Eventbrite — only /e/{slug-id} is a specific event
    if (hostname.endsWith("eventbrite.com")) {
      return /^\/e\/[^/]+-\d+/.test(path)
    }

    // Meetup — only /{group}/events/{numeric-id} is a specific event
    if (hostname.endsWith("meetup.com")) {
      return /^\/[^/]+\/events\/\d{6,}/.test(path)
    }

    // Partiful — /e/<id> is a specific event invite
    if (hostname.endsWith("partiful.com")) {
      return /^\/e\/[A-Za-z0-9]+/.test(path)
    }

    // Everything else: reject. We do not have a verified pattern for this
    // domain so we will not risk dumping the user on a generic page.
    return false
  } catch {
    return false
  }
}

// Specific apply pages for internships. Career homepages and job-search pages
// are rejected — we want the actual posting / program page.
export function isSpecificApplyUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const { hostname, pathname } = new URL(url)
    const path = pathname.replace(/\/$/, "")

    const search = new URL(url).search.toLowerCase()
    const hasInternFilter =
      search.includes("intern") ||
      search.includes("student") ||
      search.includes("university") ||
      search.includes("early%20career") ||
      search.includes("early+career")

    // ATS / job board URLs that have explicit job IDs are always specific
    if (hostname.endsWith("greenhouse.io") && /\/jobs\/\d+/.test(path)) return true
    if (hostname.endsWith("lever.co") && /\/[^/]+\/[a-f0-9-]{20,}/.test(path)) return true
    if (hostname.endsWith("ashbyhq.com") && /\/[^/]+\/[a-f0-9-]{20,}/.test(path)) return true
    if (hostname.endsWith("workdayjobs.com") && /\/job\//.test(path)) return true

    // Filtered list pages (e.g., ?commitment=Intern, ?categories=Internship) — accept
    // because they show the actual postings, not generic homepages.
    if (hasInternFilter) {
      return true
    }

    // Company-specific program pages we know are real apply portals.
    const knownProgramPages = [
      /goldmansachs\.com\/careers\/students/,
      /databricks\.com\/company\/careers\/university-recruiting/,
      /stripe\.com\/jobs\/search/,
      /vercel\.com\/careers/,
      /notion\.com\/careers/,
      /jobs\.a16z\.com\/jobs/,
    ]
    if (knownProgramPages.some((r) => r.test(url))) return true

    // Reject obvious homepages / general career pages.
    const genericPaths = ["", "/", "/careers", "/jobs", "/careers/jobs", "/about"]
    if (genericPaths.includes(path)) return false

    // Unfiltered ATS board roots are too broad for an "Apply Now" CTA.
    if (hostname.endsWith("greenhouse.io") && /^\/[^/]+$/.test(path)) return false
    if (hostname.endsWith("lever.co") && /^\/[^/]+$/.test(path)) return false
    if (hostname.endsWith("ashbyhq.com") && /^\/[^/]+$/.test(path)) return false

    // Generic safety net.
    for (const tok of GENERIC_PATH_TOKENS) {
      if (path.toLowerCase().includes(tok)) return false
    }

    return true
  } catch {
    return false
  }
}
