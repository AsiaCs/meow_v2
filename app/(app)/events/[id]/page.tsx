import { notFound } from "next/navigation"
import Link from "next/link"
import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { scrapeCerebralValley, type ScrapedEvent } from "@/lib/scrapers/cerebralvalley"
import { scrapeLuma } from "@/lib/scrapers/luma"
import { filterReachable } from "@/lib/validators/links"
import { isSpecificEventUrl } from "@/lib/validators/specific-urls"
import { ArrowLeft, MapPin, Monitor, CalendarDays, ExternalLink, Clock, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const runtime = "nodejs"
export const revalidate = 1800

const TAG_VARIANTS: Array<"purple" | "pink" | "green" | "gray"> = ["purple", "pink", "green", "gray"]

const SOURCE_LABELS: Record<string, string> = {
  "cerebral-valley": "Cerebral Valley",
  "Cerebral Valley": "Cerebral Valley",
  luma: "Luma",
  Luma: "Luma",
  community: "Community",
  user: "Community",
  scraped: "Curated",
}

function getSourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? SOURCE_LABELS[source.toLowerCase()] ?? source
}

function stableId(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return `ev-${Math.abs(h).toString(36)}`
}

function formatEventDate(date: Date) {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  })
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  })
  return { dateStr, timeStr }
}

const getCachedScrapedEvents = unstable_cache(
  async (): Promise<ScrapedEvent[]> => {
    const [cvResult, lumaResult] = await Promise.allSettled([
      scrapeCerebralValley(),
      scrapeLuma("networking tech startup"),
    ])
    const cv = cvResult.status === "fulfilled" ? cvResult.value : []
    const lu = lumaResult.status === "fulfilled" ? lumaResult.value : []
    const specific = [...cv, ...lu].filter((e) => isSpecificEventUrl(e.registrationUrl))
    return await filterReachable(specific, (e) => e.registrationUrl)
  },
  ["events-detail-source-v2"],
  { revalidate: 1800, tags: ["events"] },
)

async function findEvent(id: string): Promise<ScrapedEvent | null> {
  // Try DB first
  try {
    const supabase = await createClient()
    const { data: dbEvents } = await supabase
      .from("events")
      .select("title, description, startDate, endDate, location, isVirtual, registrationUrl, imageUrl, tags, source, isFree")
      .eq("status", "APPROVED")
    if (Array.isArray(dbEvents)) {
      const match = (dbEvents as any[]).find(
        (e) => stableId(e.registrationUrl) === id && isSpecificEventUrl(e.registrationUrl),
      )
      if (match) {
        return {
          ...match,
          startDate: new Date(match.startDate),
          endDate: match.endDate ? new Date(match.endDate) : undefined,
          sourceUrl: match.registrationUrl,
        } as ScrapedEvent
      }
    }
  } catch { /* fall through */ }

  // Otherwise look in the live scraped set
  const scraped = await getCachedScrapedEvents()
  return scraped.find((e) => stableId(e.registrationUrl) === id) ?? null
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await findEvent(id)
  if (!event) notFound()

  const start = new Date(event.startDate)
  const { dateStr, timeStr } = formatEventDate(start)

  return (
    <div className="min-h-dvh bg-bg-base">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-6"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to Events
        </Link>

        <div className="border border-white/[0.06] rounded-3xl p-1.5 bg-white/[0.02] mb-6">
          {event.imageUrl ? (
            <div className="rounded-[calc(1.5rem-0.375rem)] overflow-hidden h-52">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="rounded-[calc(1.5rem-0.375rem)] h-36"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(236,72,153,0.25) 100%)",
              }}
            />
          )}

          <div className="bg-bg-card rounded-[calc(1.5rem-0.375rem)] p-6 mt-1.5">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={event.isFree ? "green" : "gray"}>
                {event.isFree ? "Free" : "Paid"}
              </Badge>
              <Badge variant="gray">{getSourceLabel(event.source)}</Badge>
              {event.isVirtual && (
                <Badge variant="purple">
                  <Monitor size={11} className="mr-1" />
                  Virtual
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold text-text-primary font-display leading-snug mb-4">
              {event.title}
            </h1>

            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <CalendarDays size={15} strokeWidth={1.5} className="text-purple flex-shrink-0" />
                {dateStr}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock size={15} strokeWidth={1.5} className="text-purple flex-shrink-0" />
                {timeStr}
              </div>
              {!event.isVirtual && event.location && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin size={15} strokeWidth={1.5} className="text-purple flex-shrink-0" />
                  {event.location}
                </div>
              )}
            </div>

            {Array.isArray(event.tags) && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {event.tags.map((tag: string, i: number) => (
                  <Badge key={tag} variant={TAG_VARIANTS[i % TAG_VARIANTS.length]}>
                    <Tag size={10} className="mr-1 opacity-70" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {event.description && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
              About this event
            </h2>
            <div className="border border-white/[0.06] rounded-2xl p-1.5 bg-white/[0.02]">
              <div className="bg-bg-card rounded-[calc(1rem-0.375rem)] p-5">
                <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </div>
          </section>
        )}

        <a
          href={event.registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ background: "var(--gradient-brand)" }}
        >
          RSVP / Register
          <ExternalLink size={16} strokeWidth={1.5} />
        </a>
      </div>
    </div>
  )
}
