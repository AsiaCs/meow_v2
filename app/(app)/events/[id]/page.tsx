import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getCuratedEvents } from "@/lib/data/curated"
import { ArrowLeft, MapPin, Monitor, CalendarDays, ExternalLink, Clock, Tag, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

function isDiscoveryUrl(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url)
    if (hostname.endsWith("lu.ma")) {
      const cityPaths = new Set([
        "/discover", "/sf", "/nyc", "/la", "/boston", "/chicago",
        "/austin", "/seattle", "/dc", "/miami", "/london", "/toronto",
      ])
      return cityPaths.has(pathname.replace(/\/$/, ""))
    }
    if (hostname.endsWith("cerebralvalley.ai")) {
      return pathname === "/events" || pathname === "/" || pathname === ""
    }
    return false
  } catch {
    return false
  }
}

const TAG_VARIANTS: Array<"purple" | "pink" | "green" | "gray"> = ["purple", "pink", "green", "gray"]

const SOURCE_LABELS: Record<string, string> = {
  "cerebral-valley": "Cerebral Valley",
  luma: "Luma",
  community: "Community",
  user: "Community",
  scraped: "Curated",
  "Y Combinator": "Y Combinator",
}

function getSourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? SOURCE_LABELS[source.toLowerCase()] ?? source
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr)
  const date = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  return { date, time }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let event: any = null

  if (id.startsWith("c-e-")) {
    const curated = getCuratedEvents()
    event = curated.find((e) => e.id === id) ?? null
  } else {
    const supabase = await createClient()
    const { data } = await supabase
      .from("events")
      .select("id, title, description, startDate, endDate, location, isVirtual, virtualLink, registrationUrl, imageUrl, tags, source, isFree, status")
      .eq("id", id)
      .single()
    event = data
  }

  if (!event) notFound()

  const { date, time } = formatEventDate(event.startDate)

  return (
    <div className="min-h-dvh bg-bg-base">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-6"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to Events
        </Link>

        {/* Hero card */}
        <div className="border border-white/[0.06] rounded-3xl p-1.5 bg-white/[0.02] mb-6">
          {/* Image or gradient */}
          {event.imageUrl ? (
            <div className="rounded-[calc(1.5rem-0.375rem)] overflow-hidden h-52">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
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
            {/* Source + free badge */}
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

            {/* Title */}
            <h1 className="text-2xl font-bold text-text-primary font-display leading-snug mb-4">
              {event.title}
            </h1>

            {/* Date + time */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <CalendarDays size={15} strokeWidth={1.5} className="text-purple flex-shrink-0" />
                {date}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock size={15} strokeWidth={1.5} className="text-purple flex-shrink-0" />
                {time}
              </div>
              {!event.isVirtual && event.location && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin size={15} strokeWidth={1.5} className="text-purple flex-shrink-0" />
                  {event.location}
                </div>
              )}
              {event.isVirtual && event.virtualLink && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Monitor size={15} strokeWidth={1.5} className="text-purple flex-shrink-0" />
                  Online event
                </div>
              )}
            </div>

            {/* Tags */}
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

        {/* Description */}
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

        {/* CTA */}
        {event.registrationUrl && (() => {
          const isDiscovery = isDiscoveryUrl(event.registrationUrl)
          const label = isDiscovery
            ? (event.isVirtual ? "Browse on Luma" : "Find events in this city")
            : "RSVP / Register"
          const Icon = isDiscovery ? Search : ExternalLink
          return (
            <>
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ background: "var(--gradient-brand)" }}
              >
                {label}
                <Icon size={16} strokeWidth={1.5} />
              </a>
              {isDiscovery && (
                <p className="text-xs text-text-muted text-center mt-3">
                  This is a community page — browse upcoming events and pick one to RSVP.
                </p>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}
