import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { scrapeLuma } from "@/lib/scrapers/luma"
import { scrapeCerebralValley, type ScrapedEvent } from "@/lib/scrapers/cerebralvalley"
import { filterReachable } from "@/lib/validators/links"
import { isSpecificEventUrl } from "@/lib/validators/specific-urls"
import { buildICS } from "@/lib/ics"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 1800

function stableId(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return `ev-${Math.abs(h).toString(36)}`
}

function slugifyFilename(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "event"
}

const getCachedScraped = unstable_cache(
  async (): Promise<ScrapedEvent[]> => {
    const [cv, lu] = await Promise.allSettled([
      scrapeCerebralValley(),
      scrapeLuma("networking tech startup"),
    ])
    const cvEvents = cv.status === "fulfilled" ? cv.value : []
    const luEvents = lu.status === "fulfilled" ? lu.value : []
    const specific = [...cvEvents, ...luEvents].filter((e) => isSpecificEventUrl(e.registrationUrl))
    return await filterReachable(specific, (e) => e.registrationUrl)
  },
  ["events-ics-source-v1"],
  { revalidate: 1800, tags: ["events"] },
)

async function findEvent(id: string): Promise<ScrapedEvent | null> {
  try {
    const supabase = await createClient()
    const { data: dbEvents } = await supabase
      .from("events")
      .select("title, description, startDate, endDate, location, isVirtual, registrationUrl, imageUrl, tags, source, isFree")
      .eq("status", "APPROVED")
    if (Array.isArray(dbEvents)) {
      type Row = {
        title: string; description: string | null; startDate: string; endDate: string | null
        location: string | null; isVirtual: boolean; registrationUrl: string
        imageUrl: string | null; tags: string[]; source: string; isFree: boolean
      }
      const match = (dbEvents as Row[]).find((e) => stableId(e.registrationUrl) === id)
      if (match) {
        return {
          ...match,
          startDate: new Date(match.startDate),
          endDate: match.endDate ? new Date(match.endDate) : undefined,
          sourceUrl: match.registrationUrl,
          description: match.description ?? undefined,
          location: match.location ?? undefined,
          imageUrl: match.imageUrl ?? undefined,
        } as ScrapedEvent
      }
    }
  } catch { /* fall through */ }

  const scraped = await getCachedScraped()
  return scraped.find((e) => stableId(e.registrationUrl) === id) ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const event = await findEvent(id)
  if (!event) {
    return new Response("event not found", { status: 404 })
  }

  const ics = buildICS({
    uid: id,
    title: event.title,
    description: [event.description, event.registrationUrl].filter(Boolean).join("\n\n"),
    location: event.isVirtual ? "Online" : event.location,
    url: event.registrationUrl,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : undefined,
  })

  const filename = `${slugifyFilename(event.title)}.ics`
  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  })
}
