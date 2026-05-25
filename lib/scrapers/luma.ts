import type { ScrapedEvent } from "./cerebralvalley"

const SOURCE = "Luma"
const BASE_URL = "https://lu.ma"

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
}

interface LumaEventJson {
  api_id?: string
  name?: string
  url?: string
  cover_url?: string
  start_at?: string
  end_at?: string
  location_type?: string
  timezone?: string
  visibility?: string
  event_type?: string
}

// Discoverable category taxonomy. Keep these short — they show up as filter chips.
export const EVENT_CATEGORIES = [
  "AI",
  "Hackathon",
  "Demo Night",
  "Vibe Coding",
  "Crypto",
  "Design",
  "Founders",
  "VC",
  "Networking",
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]

const CATEGORY_RULES: Array<{ category: EventCategory; patterns: RegExp[] }> = [
  { category: "Hackathon",  patterns: [/\bhack(athon)?\b/i, /\bhack night\b/i, /\bjam\b/i] },
  { category: "Demo Night", patterns: [/\bdemo\s*(night|day)\b/i, /\bshowcase\b/i, /\bpitch night\b/i] },
  { category: "Vibe Coding", patterns: [/\bvibe\s*cod/i, /\bcozy coding\b/i, /\bpair program/i] },
  { category: "Crypto",     patterns: [/\b(crypto|web3|blockchain|defi|nft|ethereum|solana)\b/i] },
  { category: "AI",         patterns: [/\b(ai|llm|gpt|claude|gemini|agent|ml|machine learning|diffusion|inference|gpu|fine[- ]?tune)\b/i] },
  { category: "Design",     patterns: [/\b(design|figma|ux|ui|prototyp)\b/i] },
  { category: "VC",         patterns: [/\b(vc|venture|investor|angel|seed|series\s+[a-c])\b/i] },
  { category: "Founders",   patterns: [/\b(founder|startup|launch)\b/i] },
]

function inferCategories(title: string, description = ""): EventCategory[] {
  const text = `${title} ${description}`
  const out = new Set<EventCategory>()
  for (const { category, patterns } of CATEGORY_RULES) {
    if (patterns.some((re) => re.test(text))) out.add(category)
  }
  if (out.size === 0) out.add("Networking")
  return Array.from(out).slice(0, 4)
}

function guessTags(title: string, description = ""): string[] {
  return inferCategories(title, description)
}

// Find each "event":{...} JSON object in the HTML using a balanced-brace parser.
// Luma embeds these in the Next.js Flight payload as escaped JSON inside script
// tags. The string is escape-encoded so we extract the raw substring and call
// JSON.parse on each balanced block.
function extractEventJson(html: string): LumaEventJson[] {
  const out: LumaEventJson[] = []
  const needle = '"event":{'
  let cursor = 0
  while (true) {
    const start = html.indexOf(needle, cursor)
    if (start === -1) break
    const objStart = start + needle.length - 1 // position of '{'
    let depth = 0
    let i = objStart
    let inString = false
    let escaped = false
    for (; i < html.length; i++) {
      const ch = html[i]
      if (escaped) { escaped = false; continue }
      if (ch === "\\") { escaped = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === "{") depth++
      else if (ch === "}") {
        depth--
        if (depth === 0) { i++; break }
      }
    }
    const raw = html.slice(objStart, i)
    try {
      const parsed = JSON.parse(raw) as LumaEventJson
      if (parsed && parsed.name && parsed.url && parsed.start_at) {
        out.push(parsed)
      }
    } catch { /* skip malformed */ }
    cursor = i
  }
  return out
}

function toScrapedEvent(raw: LumaEventJson): ScrapedEvent | null {
  if (!raw.name || !raw.url || !raw.start_at) return null
  const startDate = new Date(raw.start_at)
  if (isNaN(startDate.getTime())) return null

  const isVirtual = raw.location_type === "online" || raw.location_type === "virtual"
  const url = `${BASE_URL}/${raw.url}`

  return {
    title: raw.name,
    startDate,
    endDate: raw.end_at ? new Date(raw.end_at) : undefined,
    location: isVirtual ? undefined : raw.timezone?.replace(/^America\//, "").replace(/_/g, " "),
    isVirtual,
    registrationUrl: url,
    imageUrl: raw.cover_url,
    tags: guessTags(raw.name),
    source: SOURCE,
    sourceUrl: url,
    isFree: true,
  }
}

const CITY_SLUGS: Record<string, string> = {
  "san francisco": "sf",
  sf: "sf",
  "bay area": "sf",
  "new york": "nyc",
  "new york city": "nyc",
  nyc: "nyc",
  brooklyn: "nyc",
  "los angeles": "la",
  la: "la",
  london: "london",
  toronto: "toronto",
  boston: "boston",
  chicago: "chicago",
  seattle: "seattle",
  miami: "miami",
  austin: "austin",
  denver: "denver",
  atlanta: "atlanta",
  washington: "dc",
  dc: "dc",
  berlin: "berlin",
  singapore: "singapore",
}

function getCitySlug(city: string | undefined): string | null {
  if (!city) return null
  const lower = city.toLowerCase().trim()
  for (const [key, slug] of Object.entries(CITY_SLUGS)) {
    if (lower.includes(key)) return slug
  }
  return null
}

async function scrapeLumaPath(path: string): Promise<ScrapedEvent[]> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      next: { revalidate: 1800 },
    })
    if (!res.ok) return []
    const html = await res.text()
    const events = extractEventJson(html)
    const mapped = events.flatMap((e) => {
      const s = toScrapedEvent(e)
      return s ? [s] : []
    })
    // De-dupe by URL
    const seen = new Set<string>()
    return mapped.filter((e) => {
      if (seen.has(e.registrationUrl)) return false
      seen.add(e.registrationUrl)
      return true
    })
  } catch {
    return []
  }
}

// Named tech community calendars on Luma. These are the same kind of feeds
// Cerebral Valley aggregates — each one is curated by a known organizer and
// produces high-signal AI / hacker events.
const COMMUNITY_CALENDARS: Array<{ slug: string; tag: EventCategory }> = [
  { slug: "cerebralvalley", tag: "AI" },
  { slug: "aitinkerers",    tag: "AI" },
  { slug: "agihouse",       tag: "AI" },
  { slug: "build-club",     tag: "Hackathon" },
  { slug: "founders",       tag: "Founders" },
]

export async function scrapeLuma(_query: string = "networking", city?: string): Promise<ScrapedEvent[]> {
  // Three signals stacked, in priority order:
  // 1. User's city (so local events come first)
  // 2. Major hubs (SF, NYC) — fills the list if user has no city or it's empty
  // 3. Discover (global)
  // 4. Named tech communities — Cerebral-Valley-style curated feeds
  const tried = new Set<string>()
  const paths: string[] = []

  const userCity = getCitySlug(city)
  if (userCity) paths.push(`/${userCity}`)
  paths.push("/sf", "/nyc", "/discover")
  for (const c of COMMUNITY_CALENDARS) paths.push(`/${c.slug}`)

  const all: ScrapedEvent[] = []
  for (const p of paths) {
    if (tried.has(p)) continue
    tried.add(p)
    const events = await scrapeLumaPath(p)
    // If this path is a known community, force-tag every event with the community tag
    const community = COMMUNITY_CALENDARS.find((c) => `/${c.slug}` === p)
    if (community) {
      for (const e of events) {
        if (!e.tags.includes(community.tag)) e.tags.unshift(community.tag)
      }
    }
    all.push(...events)
    if (all.length >= 80) break
  }

  // Final de-dupe across all paths
  const seen = new Set<string>()
  return all.filter((e) => {
    if (seen.has(e.registrationUrl)) return false
    seen.add(e.registrationUrl)
    return true
  })
}
