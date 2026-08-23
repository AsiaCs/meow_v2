// Relevance filter for the marketing index.
//
// WHY THIS EXISTS: the landing hero claims "every AI event and internship",
// and the live feed does not support that claim on its own. Measured
// 2026-08-22: 16 of 46 events (35%) had anything tech-related in the title.
// The rest were general Luma lifestyle listings — run clubs, cake decorating,
// an oyster festival — because scrapeLuma("networking tech startup") returns
// Luma's general feed rather than a filtered one.
//
// Putting real data on the landing page is what surfaced this; a mocked hero
// with invented event names would have looked correct and shipped the lie.
//
// SCOPE: this filters the MARKETING surface only. /events keeps the full
// catalogue, because a user browsing a city index is well served by knowing
// about the run club. The landing page is where a specific promise is made,
// so that is where the promise has to hold.
//
// This is a stopgap at the read layer. The durable fix is upstream — tighten
// the scraper query, or classify at ingest — at which point this can go.

const TECH = new RegExp(
  [
    "\\bai\\b", "\\bml\\b", "\\bllm", "agent", "genai", "machine learning",
    "hack(athon)?", "\\bdev(s|elop|eloper)?\\b", "engineer", "\\bcode|coding\\b",
    "data\\b", "infra", "\\bgpu\\b", "inference", "model", "robot", "\\bxr\\b",
    "startup", "founder", "\\bvc\\b", "venture", "demo day", "pitch",
    "product manage", "design system", "open source", "\\bapi\\b", "\\bsaas\\b",
    "build(ers|ing)?\\b", "vibe cod", "prompt", "neural", "quantum", "crypto",
    "web3", "blockchain", "security", "devtool", "y combinator", "\\byc\\b",
  ].join("|"),
  "i",
)

export function isTechRelevant(input: {
  title: string
  description?: string | null
  tags?: string[] | null
}): boolean {
  if (TECH.test(input.title)) return true
  if (Array.isArray(input.tags) && input.tags.some((t) => TECH.test(t))) return true
  // Description is checked last and only as a tiebreaker — a passing mention
  // of "AI" in a paragraph is weaker evidence than the title or the tags.
  return Boolean(input.description && TECH.test(input.description.slice(0, 300)))
}

// Scraped titles carry emoji from the source ("Run Club 😎💕"). They read as
// noise in an editorial index, so strip them for display without mutating the
// stored record.
export function stripEmoji(s: string): string {
  return s
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{20E3}\u{2B00}-\u{2BFF}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}
