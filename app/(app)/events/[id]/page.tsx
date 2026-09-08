import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getAllEvents, stableEventId, type ScrapedEvent } from "@/lib/events/source"
import { fetchListedEvents } from "@/lib/events/listing"
import { isSpecificEventUrl } from "@/lib/validators/specific-urls"
import { safeExternalUrl } from "@/lib/url-helpers"
import { ArrowLeft, MapPin, Monitor, CalendarDots as CalendarDays, ArrowSquareOut as ExternalLink, Clock, Tag } from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"
import { AddToCalendar } from "@/components/events/add-to-calendar"

export const runtime = "nodejs"
export const revalidate = 1800


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

type EventRow = {
  id: string                       // real Postgres UUID, the primary lookup key for user events
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  isVirtual: boolean
  registrationUrl: string
  imageUrl: string | null
  tags: string[]
  source: string
  isFree: boolean
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

// Resolve against the exact payload the listing rendered.
//
// getAllEvents() is an unstable_cache instance, and Next bundles route
// handlers and pages separately — so /api/events and this page each hold
// their OWN fill of that cache, populated at different moments from a live
// scrape whose result set changes. Measured locally: the page's fill had 27
// events while /api/events served 31, stably, across repeated requests and
// rebuilds. The 9-event gap was invisible to the user until they clicked a
// card the listing had just drawn and got a 404.
//
// Asking the listing endpoint directly makes that class of mismatch
// impossible by construction: if the card was rendered, the payload behind it
// resolves. It is edge-cached (s-maxage=60), so this is not a real round trip
// in production.
async function findViaListing(id: string): Promise<ScrapedEvent | null> {
  const listed = await fetchListedEvents()
  return listed.find((e) => stableEventId(e.registrationUrl) === id || (e as { id?: string }).id === id) ?? null
}

async function findEvent(id: string): Promise<ScrapedEvent | null> {
  // 1. Try the shared live-scraped cache first. Same function the listing
  //    endpoint uses, so the IDs always line up.
  const scrapedCity = await getAllEvents()
  let hit = scrapedCity.find((e) => stableEventId(e.registrationUrl) === id)
  if (hit) return hit

  // 2. Fallback to DB (user-submitted or older scraped rows)
  try {
    const supabase = await createClient()
    const { data: dbEvents } = await supabase
      .from("events")
      .select("id, title, description, startDate, endDate, location, isVirtual, registrationUrl, imageUrl, tags, source, isFree")
      .eq("status", "APPROVED")
    if (Array.isArray(dbEvents)) {
      // Match by real UUID OR URL hash. NO URL whitelist filter here — the
      // whitelist gates which SCRAPED rows enter the listing; if a row is
      // already in the DB with a matching ID, the user is entitled to its
      // detail page regardless of what the URL looks like. Previously this
      // line silently dropped legitimate hits (Partiful, custom domains)
      // and the user landed on a 404.
      const match = (dbEvents as EventRow[]).find(
        (e) => e.id === id || stableEventId(e.registrationUrl) === id,
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

  // 3. Last resort: whatever the listing endpoint is currently serving. This
  //    is the step that actually closes the cache-fill gap described above.
  return await findViaListing(id)
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
  const safeRegistrationUrl = safeExternalUrl(event.registrationUrl)
  // User-submitted events are always RSVP-able — the user picked the URL.
  // Scraped events still go through the strict whitelist.
  const canRegister = Boolean(
    safeRegistrationUrl &&
      (event.source === "user" || isSpecificEventUrl(safeRegistrationUrl)),
  )

  return (
    <div className="min-h-dvh bg-bg-base">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-body text-text-muted hover:text-text-secondary transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back to Events
        </Link>

        <div className="border border-border-subtle rounded-panel p-1.5 bg-bg-raised mb-6">
          {event.imageUrl ? (
            <div className="rounded-panel overflow-hidden h-52">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-panel h-36 bg-bg-sunken" />
          )}

          <div className="bg-bg-raised rounded-panel p-6 mt-1.5">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={event.isFree ? "positive" : "neutral"}>
                {event.isFree ? "Free" : "Paid"}
              </Badge>
              <Badge variant="neutral">{getSourceLabel(event.source)}</Badge>
              {event.isVirtual && (
                <Badge variant="accent">
                  <Monitor size={12} aria-hidden="true" />
                  Virtual
                </Badge>
              )}
            </div>

            <h1 className="text-heading-l font-semibold text-text-primary font-display leading-snug mb-4">
              {event.title}
            </h1>

            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2 text-body text-text-secondary">
                <CalendarDays size={15} className="text-accent flex-shrink-0" />
                {dateStr}
              </div>
              <div className="flex items-center gap-2 text-body text-text-secondary">
                <Clock size={15} className="text-accent flex-shrink-0" />
                {timeStr}
              </div>
              {!event.isVirtual && event.location && (
                <div className="flex items-center gap-2 text-body text-text-secondary">
                  <MapPin size={15} className="text-accent flex-shrink-0" />
                  {event.location}
                </div>
              )}
            </div>

            {Array.isArray(event.tags) && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {event.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    <Tag size={11} aria-hidden="true" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {event.description && (
          <section className="mb-6">
            <h2 className="text-meta font-semibold text-text-muted uppercase tracking-widest mb-3">
              About this event
            </h2>
            <div className="border border-border-subtle rounded-panel p-1.5 bg-bg-raised">
              <div className="bg-bg-raised rounded-panel p-5">
                <p className="text-text-secondary text-body leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {canRegister && safeRegistrationUrl ? (
            <a
              href={safeRegistrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-panel bg-text-primary text-bg-base font-semibold text-lead hover:bg-text-primary/90 active:scale-[0.98] transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              RSVP / Register
              <ExternalLink size={16} />
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-panel border border-border-default text-text-muted font-semibold text-lead opacity-70 cursor-not-allowed"
            >
              RSVP unavailable
            </button>
          )}
          <AddToCalendar
            eventId={id}
            title={event.title}
            description={event.description ?? null}
            startDate={event.startDate}
            endDate={event.endDate ?? null}
            location={event.location ?? null}
            isVirtual={event.isVirtual}
            registrationUrl={event.registrationUrl}
          />
        </div>
      </div>
    </div>
  )
}
