import * as cheerio from "cheerio"
import type { ScrapedEvent } from "./cerebralvalley"

const SOURCE = "Luma"
const BASE_URL = "https://lu.ma"

interface LumaApiEvent {
  api_id?: string
  name?: string
  start_at?: string
  end_at?: string
  cover_url?: string
  description?: string
  geo_address_info?: {
    full_address?: string
    city?: string
    country?: string
  }
  location_type?: string
  url?: string
  zoom_meeting_url?: string
  ticket_info?: {
    is_free?: boolean
    price?: number
    currency?: string
  }
  tags?: string[]
}

interface LumaApiResponse {
  entries?: Array<{ event?: LumaApiEvent }>
  events?: LumaApiEvent[]
}

function guessTags(title: string, description: string): string[] {
  const combined = `${title} ${description}`.toLowerCase()
  const tagMap: Record<string, string> = {
    ai: "AI",
    "machine learning": "Machine Learning / AI",
    fintech: "Finance",
    finance: "Finance",
    "product management": "Product Management",
    design: "Design",
    startup: "Entrepreneurship",
    entrepreneurship: "Entrepreneurship",
    engineering: "Software Engineering",
    software: "Software Engineering",
    data: "Data Science",
    investing: "Investing",
    venture: "Investing",
    marketing: "Marketing",
    networking: "Networking",
  }

  const tags = new Set<string>()
  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (combined.includes(keyword)) {
      tags.add(tag)
      if (tags.size >= 4) break
    }
  }

  if (tags.size === 0) tags.add("Networking")
  return Array.from(tags)
}

function mapLumaEvent(raw: LumaApiEvent): ScrapedEvent | null {
  if (!raw.name || !raw.start_at) return null

  const startDate = new Date(raw.start_at)
  if (isNaN(startDate.getTime())) return null

  const eventUrl = raw.url
    ? raw.url.startsWith("http")
      ? raw.url
      : `${BASE_URL}/${raw.url}`
    : raw.api_id
      ? `${BASE_URL}/event/${raw.api_id}`
      : BASE_URL

  const isVirtual =
    raw.location_type === "online" ||
    raw.location_type === "virtual" ||
    Boolean(raw.zoom_meeting_url)

  const location = raw.geo_address_info?.full_address ?? raw.geo_address_info?.city ?? undefined

  const isFree =
    raw.ticket_info?.is_free === true ||
    raw.ticket_info?.price === 0 ||
    raw.ticket_info === undefined

  const tags =
    raw.tags && raw.tags.length > 0
      ? raw.tags.slice(0, 4)
      : guessTags(raw.name, raw.description ?? "")

  return {
    title: raw.name,
    description: raw.description?.slice(0, 2000) || undefined,
    startDate,
    endDate: raw.end_at ? new Date(raw.end_at) : undefined,
    location: isVirtual ? undefined : location,
    isVirtual,
    registrationUrl: eventUrl,
    imageUrl: raw.cover_url || undefined,
    tags,
    source: SOURCE,
    sourceUrl: eventUrl,
    isFree,
  }
}

async function fetchLumaApi(query: string): Promise<ScrapedEvent[]> {
  const url = `${BASE_URL}/api/search/events?query=${encodeURIComponent(query)}&pagination_limit=20`

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Meow/1.0; +https://meow.app)",
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`Luma API responded with ${res.status}`)

  const json: LumaApiResponse = await res.json()

  // API may return entries[] or events[] depending on endpoint version
  const rawEvents: LumaApiEvent[] =
    ((json.entries ?? []).map((e) => e.event ?? (e as unknown as LumaApiEvent)).filter(Boolean).length > 0
      ? (json.entries ?? []).map((e) => e.event ?? (e as unknown as LumaApiEvent)).filter(Boolean)
      : (json.events ?? []))

  return rawEvents.flatMap((e) => {
    const mapped = mapLumaEvent(e)
    return mapped ? [mapped] : []
  })
}

async function scrapeLumaWeb(query: string): Promise<ScrapedEvent[]> {
  const searchUrl = `${BASE_URL}/discover/events?query=${encodeURIComponent(query)}`

  const res = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Meow/1.0; +https://meow.app)",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) return []

  const html = await res.text()
  const $ = cheerio.load(html)
  const events: ScrapedEvent[] = []

  // Luma's web app renders event cards with various class patterns
  const selectors = [
    "[class*='event-link']",
    "[class*='EventCard']",
    "a[href*='/event/']",
    "[class*='card']",
  ]

  let $cards = $([])
  for (const sel of selectors) {
    const found = $(sel)
    if (found.length >= 2) {
      $cards = found
      break
    }
  }

  $cards.each((_, el) => {
    try {
      const $el = $(el)

      const title =
        $el.find("h1,h2,h3,h4").first().text().trim() ||
        $el.find("[class*='title']").first().text().trim()

      if (!title || title.length < 4) return

      const href = $el.is("a") ? $el.attr("href") : $el.find("a").first().attr("href")
      const fullUrl = href
        ? href.startsWith("http")
          ? href
          : `${BASE_URL}${href}`
        : searchUrl

      const timeEl = $el.find("time").first()
      const dateText =
        timeEl.attr("datetime") ??
        timeEl.text().trim() ??
        $el.find("[class*='date']").first().text().trim()

      const startDate = dateText ? new Date(dateText) : new Date(Date.now() + 7 * 86400000)
      if (isNaN(startDate.getTime())) return

      const locationText = $el.find("[class*='location'],address").first().text().trim()
      const isVirtual = /virtual|online|zoom/i.test(locationText)

      const desc = $el.find("p").first().text().trim()
      const imgSrc = $el.find("img").first().attr("src")

      events.push({
        title,
        description: desc || undefined,
        startDate,
        location: isVirtual ? undefined : locationText || undefined,
        isVirtual,
        registrationUrl: fullUrl,
        imageUrl: imgSrc
          ? imgSrc.startsWith("http")
            ? imgSrc
            : `${BASE_URL}${imgSrc}`
          : undefined,
        tags: guessTags(title, desc),
        source: SOURCE,
        sourceUrl: fullUrl,
        isFree: true,
      })
    } catch {
      // Skip malformed card
    }
  })

  return events.slice(0, 20)
}

export async function scrapeLuma(query: string = "networking"): Promise<ScrapedEvent[]> {
  try {
    // Try the public API first
    const apiResults = await fetchLumaApi(query)
    if (apiResults.length > 0) return apiResults
  } catch {
    // Fall through to web scraping
  }

  try {
    return await scrapeLumaWeb(query)
  } catch {
    return []
  }
}
