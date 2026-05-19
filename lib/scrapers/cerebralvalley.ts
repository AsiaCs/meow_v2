import * as cheerio from "cheerio"

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

const BASE_URL = "https://cerebralvalley.ai"
const EVENTS_URL = `${BASE_URL}/events`
const SOURCE = "Cerebral Valley"

function parseEventDate(raw: string): Date | null {
  if (!raw) return null
  const trimmed = raw.trim()
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) return parsed

  // Try common formats: "May 20, 2026" / "May 20" / "5/20/2026"
  const withYear = /(\w+ \d{1,2},?\s*\d{4})/i.exec(trimmed)
  if (withYear) {
    const d = new Date(withYear[1])
    if (!isNaN(d.getTime())) return d
  }

  return null
}

function isVirtualEvent(text: string): boolean {
  return /virtual|online|zoom|remote|livestream/i.test(text)
}

function guessTags(title: string, description: string): string[] {
  const combined = `${title} ${description}`.toLowerCase()
  const tagMap: Record<string, string> = {
    ai: "AI",
    "machine learning": "Machine Learning / AI",
    ml: "Machine Learning / AI",
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

export async function scrapeCerebralValley(): Promise<ScrapedEvent[]> {
  try {
    const res = await fetch(EVENTS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Meow/1.0; +https://meow.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return []

    const html = await res.text()
    const $ = cheerio.load(html)
    const events: ScrapedEvent[] = []

    // Try multiple selectors to find event cards
    const candidateSelectors = [
      "article",
      "[class*='event-card']",
      "[class*='EventCard']",
      "[class*='event_card']",
      "[class*='card']",
      "[class*='Event']",
      "li[class*='event']",
      "li[class*='Event']",
      ".events-list > *",
      "[data-testid*='event']",
    ]

    let $cards = $([]) // empty cheerio collection
    for (const sel of candidateSelectors) {
      const found = $(sel)
      if (found.length >= 2) {
        $cards = found
        break
      }
    }

    // Fall back to any anchor with an event-like path
    if ($cards.length === 0) {
      $("a[href*='/event']").each((_, el) => {
        const $el = $(el)
        const title =
          $el.find("h1,h2,h3,h4").first().text().trim() ||
          $el.attr("aria-label")?.trim() ||
          $el.text().trim()

        if (!title || title.length < 4) return

        const href = $el.attr("href") ?? ""
        const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`
        const dateText =
          $el.find("time").attr("datetime") ??
          $el.find("[class*='date']").first().text().trim()
        const startDate = parseEventDate(dateText) ?? new Date(Date.now() + 7 * 86400000)
        const locationText = $el.find("[class*='location'],address").first().text().trim()
        const virtual = isVirtualEvent(locationText)
        const desc = $el.find("p").first().text().trim()
        const imgSrc = $el.find("img").first().attr("src")

        events.push({
          title,
          description: desc || undefined,
          startDate,
          location: virtual ? undefined : locationText || undefined,
          isVirtual: virtual,
          registrationUrl: fullUrl,
          imageUrl: imgSrc ? (imgSrc.startsWith("http") ? imgSrc : `${BASE_URL}${imgSrc}`) : undefined,
          tags: guessTags(title, desc),
          source: SOURCE,
          sourceUrl: fullUrl,
          isFree: true,
        })
      })

      return events.slice(0, 20)
    }

    $cards.each((_, el) => {
      try {
        const $el = $(el)

        const title =
          $el.find("h1,h2,h3,h4").first().text().trim() ||
          $el.find("[class*='title']").first().text().trim() ||
          $el.find("[class*='Title']").first().text().trim()

        if (!title || title.length < 4) return

        // Registration URL
        const anchor = $el.find("a[href]").first()
        const href = anchor.attr("href") ?? $el.closest("a").attr("href") ?? ""
        const fullUrl = href.startsWith("http") ? href : href ? `${BASE_URL}${href}` : EVENTS_URL

        // Date
        const timeEl = $el.find("time").first()
        const dateText =
          timeEl.attr("datetime") ??
          timeEl.text().trim() ??
          $el.find("[class*='date'],[class*='Date']").first().text().trim()
        const startDate = parseEventDate(dateText) ?? new Date(Date.now() + 7 * 86400000)

        // Location / virtual
        const locationText =
          $el.find("[class*='location'],[class*='Location'],address").first().text().trim()
        const virtual = isVirtualEvent(locationText + " " + title)

        // Description
        const desc = $el.find("p").first().text().trim()

        // Image
        const imgSrc = $el.find("img").first().attr("src")
        const imageUrl = imgSrc
          ? imgSrc.startsWith("http")
            ? imgSrc
            : `${BASE_URL}${imgSrc}`
          : undefined

        // Free check
        const priceText = $el.find("[class*='price'],[class*='Price']").first().text().trim()
        const isFree = !priceText || /free|0/i.test(priceText)

        events.push({
          title,
          description: desc || undefined,
          startDate,
          location: virtual ? undefined : locationText || undefined,
          isVirtual: virtual,
          registrationUrl: fullUrl,
          imageUrl,
          tags: guessTags(title, desc),
          source: SOURCE,
          sourceUrl: fullUrl,
          isFree,
        })
      } catch {
        // Skip malformed card silently
      }
    })

    return events.slice(0, 20)
  } catch {
    return []
  }
}
