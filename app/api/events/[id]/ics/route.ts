import { createClient } from "@/lib/supabase/server"
import { getAllEvents, stableEventId, type ScrapedEvent } from "@/lib/events/source"
import { isSpecificEventUrl } from "@/lib/validators/specific-urls"
import { buildICS } from "@/lib/ics"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 1800

function slugifyFilename(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "event"
}

async function findEvent(id: string): Promise<ScrapedEvent | null> {
  const scraped = await getAllEvents()
  const hit = scraped.find((e) => stableEventId(e.registrationUrl) === id)
  if (hit) return hit

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
      const match = (dbEvents as Row[]).find(
        (e) => stableEventId(e.registrationUrl) === id && isSpecificEventUrl(e.registrationUrl),
      )
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

  return null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const event = await findEvent(id)
  if (!event) return new Response("event not found", { status: 404 })

  const ics = buildICS({
    uid: id,
    title: event.title,
    description: [event.description, event.registrationUrl].filter(Boolean).join("\n\n"),
    location: event.isVirtual ? "Online" : event.location,
    url: event.registrationUrl,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : undefined,
  })

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slugifyFilename(event.title)}.ics"`,
      "Cache-Control": "private, max-age=300",
    },
  })
}
