// Cerebral Valley event scraper.
//
// CV's public site (cerebralvalley.ai/events) is a Next.js client-rendered SPA.
// The HTML payload contains zero event data, so Cheerio/Axios over the page
// returns nothing. The site's React bundle calls a public API endpoint that we
// hit directly — same endpoint their own /events page uses, so the data is
// always current.
//
//   GET https://api.cerebralvalley.ai/v1/public/event/pull?approved=true&limit=50&offset=0
//
// Response shape (truncated):
//   {
//     detail: "Events retrieved successfully",
//     events: [
//       {
//         id, name, description, descriptionSummary,
//         startDateTime, endDateTime,       // "YYYY-MM-DD HH:MM:SS" in UTC
//         url,                              // canonical https://cerebralvalley.ai/e/<slug>
//         location, venue,
//         type,                             // "HACKATHON" | "MEETUP" | null
//         CVEvent, status, imageUrl,
//         featuredStartTime, featuredEndTime,
//         platformEventData,
//       }, ...
//     ],
//   }

export interface ScrapedEvent {
  title: string
  description?: string
  startDate: Date
  endDate?: Date
  location?: string
  isVirtual: boolean
  registrationUrl: string
  imageUrl?: string
  tags: string[]
  source: string
  sourceUrl: string
  isFree: boolean
}

const SOURCE = "Cerebral Valley"
const API = "https://api.cerebralvalley.ai/v1/public/event/pull"
const PAGE_SIZE = 50
const MAX_EVENTS = 100

interface CVEventRaw {
  id?: string
  name?: string
  description?: string | null
  descriptionSummary?: string | null
  startDateTime?: string
  endDateTime?: string | null
  url?: string
  location?: string | null
  venue?: string | null
  type?: string | null         // "HACKATHON", "MEETUP", etc.
  CVEvent?: boolean
  status?: string              // "approved"
  imageUrl?: string | null
}

interface CVPullResponse {
  detail?: string
  events?: CVEventRaw[]
}

// "2025-05-24 16:00:00" — CV API returns naive timestamps. Treat as UTC.
function parseCVDate(s: string | undefined): Date | null {
  if (!s) return null
  const isoLike = s.includes("T") ? s : s.replace(" ", "T") + "Z"
  const d = new Date(isoLike)
  return isNaN(d.getTime()) ? null : d
}

function isVirtualLocation(location: string | null | undefined): boolean {
  if (!location) return true
  return /\b(remote|virtual|online|zoom)\b/i.test(location)
}

function inferTags(name: string, type: string | null | undefined): string[] {
  const tags = new Set<string>()
  if (type === "HACKATHON") tags.add("Hackathon")
  const lower = name.toLowerCase()
  if (/\b(ai|llm|gpt|claude|gemini|agent|ml|machine learning|diffusion|inference|gpu|fine[- ]?tune|llama|mistral)\b/i.test(lower)) tags.add("AI")
  if (/\bhack(athon)?\b/i.test(lower)) tags.add("Hackathon")
  if (/\bdemo\s*(night|day)\b/i.test(lower) || /\bshowcase\b/i.test(lower)) tags.add("Demo Night")
  if (/\b(crypto|web3|blockchain|defi|nft|solana)\b/i.test(lower)) tags.add("Crypto")
  if (/\b(design|figma)\b/i.test(lower)) tags.add("Design")
  if (/\b(founder|startup)\b/i.test(lower)) tags.add("Founders")
  if (/\b(vc|venture|investor)\b/i.test(lower)) tags.add("VC")
  if (tags.size === 0) tags.add("Networking")
  return Array.from(tags).slice(0, 4)
}

function mapEvent(raw: CVEventRaw): ScrapedEvent | null {
  if (!raw.name || !raw.url) return null
  const start = parseCVDate(raw.startDateTime)
  if (!start) return null
  const end = parseCVDate(raw.endDateTime ?? undefined) ?? undefined

  // Canonicalize the URL — keep it on cerebralvalley.ai/e/<slug>, which 302s
  // to the actual RSVP host (Luma, partiful, etc.) at click time.
  const url = raw.url.startsWith("http") ? raw.url : `https://cerebralvalley.ai${raw.url}`

  const locationRaw = raw.venue?.trim() || raw.location?.trim() || null
  const isVirtual = isVirtualLocation(locationRaw)

  return {
    title: raw.name.trim(),
    description: (raw.descriptionSummary ?? raw.description ?? "").trim().slice(0, 1000) || undefined,
    startDate: start,
    endDate: end,
    location: isVirtual ? undefined : locationRaw ?? undefined,
    isVirtual,
    registrationUrl: url,
    imageUrl: raw.imageUrl ?? undefined,
    tags: inferTags(raw.name, raw.type),
    source: SOURCE,
    sourceUrl: url,
    isFree: true,  // CV events are free to RSVP; ticketing is on the host
  }
}

async function pullFeatured(): Promise<CVEventRaw[]> {
  // featured=true returns the curated upcoming-events feed shown on CV's
  // /events page. approved=true returns the full historical archive, which
  // is almost entirely past events.
  const res = await fetch(`${API}?featured=true`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; Meow/1.0; +https://meow-two-pied.vercel.app)",
    },
    next: { revalidate: 1800 },
  })
  if (!res.ok) return []
  const json = (await res.json()) as CVPullResponse
  return Array.isArray(json.events) ? json.events : []
}

async function pullApprovedUpcoming(): Promise<CVEventRaw[]> {
  // Also paginate approved=true and keep only upcoming. CV's archive includes
  // future hackathons that aren't in the "featured" highlight set.
  const collected: CVEventRaw[] = []
  const now = new Date()
  for (let offset = 0; offset < 250; offset += PAGE_SIZE) {
    const params = new URLSearchParams({
      approved: "true",
      limit: String(PAGE_SIZE),
      offset: String(offset),
    })
    const res = await fetch(`${API}?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; Meow/1.0; +https://meow-two-pied.vercel.app)",
      },
      next: { revalidate: 1800 },
    })
    if (!res.ok) break
    const json = (await res.json()) as CVPullResponse
    const page = Array.isArray(json.events) ? json.events : []
    if (page.length === 0) break

    // Stop once we hit a page where every event is in the past — the API
    // returns chronologically and there's no point paging further back.
    let pageHasFuture = false
    for (const ev of page) {
      const sd = parseCVDate(ev.startDateTime)
      if (sd && sd > now) {
        collected.push(ev)
        pageHasFuture = true
      }
    }
    if (!pageHasFuture) break
    if (page.length < PAGE_SIZE) break
  }
  return collected
}

// De-dupe by (lowercased title, UTC date). Keeps the first occurrence per
// match — caller decides ordering.
function dedupe(events: ScrapedEvent[]): ScrapedEvent[] {
  const seen = new Set<string>()
  const out: ScrapedEvent[] = []
  for (const e of events) {
    const day = e.startDate.toISOString().slice(0, 10)
    const key = `${e.title.toLowerCase().trim()}|${day}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(e)
  }
  return out
}

export async function scrapeCerebralValley(): Promise<ScrapedEvent[]> {
  try {
    // Pull both feeds in parallel: the curated featured list + the upcoming
    // slice of the full archive. Merge, dedupe, filter to future.
    const [featured, archive] = await Promise.allSettled([
      pullFeatured(),
      pullApprovedUpcoming(),
    ])
    const all: CVEventRaw[] = [
      ...(featured.status === "fulfilled" ? featured.value : []),
      ...(archive.status === "fulfilled" ? archive.value : []),
    ]

    const mapped: ScrapedEvent[] = []
    for (const raw of all) {
      const m = mapEvent(raw)
      if (m) mapped.push(m)
      if (mapped.length >= MAX_EVENTS) break
    }

    const now = new Date()
    const upcoming = mapped.filter((e) => (e.endDate ?? e.startDate) > now)
    return dedupe(upcoming)
  } catch (err) {
    console.error("[scrapeCerebralValley]", err)
    return []
  }
}
