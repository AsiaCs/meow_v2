"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, Navigation, MapPin, Globe, PlusCircle } from "lucide-react"
import { EventCard } from "@/components/events/event-card"
import { CalendarSidebar } from "@/components/events/calendar-sidebar"
import { cn, isOnLocalDay } from "@/lib/utils"
import { useUserLocation } from "@/hooks/use-user-location"
import { distanceMiles } from "@/lib/geo/haversine"

interface Event {
  id: string
  title: string
  description?: string | null
  startDate: string
  location?: string | null
  isVirtual: boolean
  registrationUrl?: string | null
  imageUrl?: string | null
  tags: string[]
  isFree: boolean
  source: string
  // Structured geo (populated by lib/geo/parse.ts server-side)
  venue?: string | null
  city?: string | null
  region?: string | null
  state?: string | null
  country?: string | null
  lat?: number | null
  lng?: number | null
}

const RADIUS_OPTIONS = [10, 25, 50, 100, 250] as const
type RadiusMiles = (typeof RADIUS_OPTIONS)[number] | null

// Quick-filter presets per the design dashboard. Each pill maps to a
// real predicate over the event list — labels match the design canvas.
type FilterTab = "this-week" | "hackathons" | "free" | "workshops"

const TABS: { label: string; value: FilterTab }[] = [
  { label: "This week", value: "this-week" },
  { label: "Hackathons", value: "hackathons" },
  { label: "Free", value: "free" },
  { label: "Workshops", value: "workshops" },
]

const CATEGORY_CHIPS = [
  "AI", "Hackathon", "Demo Night", "Vibe Coding",
  "Crypto", "Design", "Founders", "VC", "Networking",
] as const

function extractCity(location: string): string {
  return location.split(",")[0].trim()
}

// Ask the browser for the user's coordinates and reverse-geocode them via
// OpenStreetMap Nominatim. Returns the city string (or null if anything
// goes wrong — permission denied, no support, no result). Silent — no UI.
async function detectBrowserCity(timeoutMs = 6000): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null
  const coords = await new Promise<GeolocationPosition | null>((resolve) => {
    let resolved = false
    const finish = (v: GeolocationPosition | null) => {
      if (!resolved) {
        resolved = true
        resolve(v)
      }
    }
    setTimeout(() => finish(null), timeoutMs)
    navigator.geolocation.getCurrentPosition(
      (p) => finish(p),
      () => finish(null),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60 * 60 * 1000 },
    )
  })
  if (!coords) return null
  try {
    const { latitude, longitude } = coords.coords
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
      { headers: { "Accept-Language": "en" } },
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      address?: { city?: string; town?: string; village?: string }
    }
    const a = data.address ?? {}
    return a.city ?? a.town ?? a.village ?? null
  } catch {
    return null
  }
}

type EventWithDistance = Event & { distanceMi?: number | null }

interface DayGroup {
  key: string
  label: string
  sublabel: string
  items: EventWithDistance[]
}

function groupByDay(events: EventWithDistance[]): DayGroup[] {
  const groups = new Map<string, EventWithDistance[]>()
  for (const ev of events) {
    const d = new Date(ev.startDate)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const bucket = groups.get(key)
    if (bucket) bucket.push(ev)
    else groups.set(key, [ev])
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      const [ay, am, ad] = a.split("-").map(Number)
      const [by, bm, bd] = b.split("-").map(Number)
      return new Date(ay, am, ad).getTime() - new Date(by, bm, bd).getTime()
    })
    .map(([key, items]) => {
      const d = new Date(items[0].startDate)
      const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()

      let label: string
      if (sameDay(d, today)) label = "Today"
      else if (sameDay(d, tomorrow)) label = "Tomorrow"
      else
        label = d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })

      const sublabel = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })

      return { key, label, sublabel: label === sublabel ? "" : sublabel, items }
    })
}

export default function EventsPage() {
  const searchParams = useSearchParams()
  const cityParam = searchParams.get("city")
  const categoryParam = searchParams.get("category")

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCity, setSelectedCity] = useState<string>(cityParam ?? "all")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  )
  // The city the auto-detect set on first load, even if we later widen the
  // filter to "all". Used to render a small "showing all — none in {Sacramento}"
  // banner so the widen behavior isn't invisible.
  const [autoSelectedCity, setAutoSelectedCity] = useState<string | null>(null)
  const [autoWidened, setAutoWidened] = useState(false)

  // Proximity engine state
  const userLoc = useUserLocation()
  const [sortByDistance, setSortByDistance] = useState(false)
  const [radiusMiles, setRadiusMiles] = useState<RadiusMiles>(null)

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  useEffect(() => {
    // Load events and user location in parallel
    Promise.all([
      // cache: 'no-store' = always go to the server. Without this, the browser
      // can serve a memoized copy from before the user submitted their event,
      // making fresh submissions appear "missing" until manual hard-reload.
      fetch("/api/events", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ])
      .then(async ([eventsData, meData]) => {
        const rawEvents = Array.isArray(eventsData) ? eventsData : eventsData.events ?? []
        setEvents(
          rawEvents.map((event: Event) => ({
            ...event,
            tags: Array.isArray(event.tags) ? event.tags : [],
          })),
        )

        // The redesigned dashboard has no city UI — sorting/filtering happens
        // exclusively through the top-right "Near me" pill (which fires
        // navigator.geolocation directly). Auto-narrowing to a city silently
        // would hide events with no way for the user to reset it, so we leave
        // selectedCity on "all" and let the explicit ?city= URL param still
        // win when present (used by deep-linked profile views).
        if (cityParam) {
          // already initialized — user explicitly asked for this
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Curated global tech-hub list. Dynamic city extraction from event locations
  // produced garbage chips like "Datadog - Headquarters" or "18 E 50th St" —
  // those are venue / street strings, not cities. This is the locked allowlist.
  // Each entry: a display label, and the matchers (substrings the event
  // location can contain to be considered "in" that city).
  const MAJOR_CITIES: Array<{ label: string; match: string[] }> = useMemo(
    () => [
      // North America
      { label: "San Francisco", match: ["san francisco", "sf,", "bay area", "palo alto", "menlo park", "mountain view", "san jose", "oakland"] },
      { label: "New York",      match: ["new york", "nyc", "manhattan", "brooklyn", "queens"] },
      { label: "Los Angeles",   match: ["los angeles", "la,", " la ", "santa monica", "venice, ca", "hollywood"] },
      { label: "Boston",        match: ["boston", "cambridge, ma", "somerville"] },
      { label: "Seattle",       match: ["seattle", "bellevue, wa", "redmond"] },
      { label: "Austin",        match: ["austin"] },
      { label: "Chicago",       match: ["chicago"] },
      { label: "Miami",         match: ["miami"] },
      { label: "Denver",        match: ["denver", "boulder"] },
      { label: "Washington DC", match: ["washington, dc", "washington dc", "arlington, va"] },
      { label: "Toronto",       match: ["toronto"] },
      // Europe
      { label: "London",        match: ["london"] },
      { label: "Paris",         match: ["paris"] },
      { label: "Berlin",        match: ["berlin"] },
      { label: "Amsterdam",     match: ["amsterdam"] },
      { label: "Lisbon",        match: ["lisbon", "lisboa"] },
      // Asia / Middle East / Pacific
      { label: "Singapore",     match: ["singapore"] },
      { label: "Tokyo",         match: ["tokyo", "東京"] },
      { label: "Seoul",         match: ["seoul", "서울"] },
      { label: "Bengaluru",     match: ["bengaluru", "bangalore"] },
      { label: "Dubai",         match: ["dubai"] },
      { label: "Sydney",        match: ["sydney"] },
    ],
    [],
  )

  // Show only chips that have at least one event matching them right now.
  const cities = useMemo(() => {
    return MAJOR_CITIES.filter((c) =>
      events.some(
        (e) =>
          !e.isVirtual &&
          e.location &&
          c.match.some((m) => e.location!.toLowerCase().includes(m)),
      ),
    ).map((c) => c.label)
  }, [events, MAJOR_CITIES])

  // ---- City matcher, extracted so both the main feed AND the Coming Up
  // sidebar use the exact same predicate. Previously the sidebar showed
  // global events even when "San Francisco" was selected.
  const matchesSelectedCity = useCallback(
    (e: Event): boolean => {
      if (selectedCity === "all") return true
      if (selectedCity === "virtual") return e.isVirtual
      if (e.isVirtual || !e.location) return false
      const city = MAJOR_CITIES.find((c) => c.label === selectedCity)
      const loc = e.location.toLowerCase()
      if (city) return city.match.some((m) => loc.includes(m))
      return loc.includes(selectedCity.toLowerCase())
    },
    [selectedCity, MAJOR_CITIES],
  )

  const filtered = events.filter((e) => {
    // Quick-filter pills — design pattern. Click toggles off.
    if (tab === "free" && !e.isFree) return false
    if (tab === "this-week") {
      const eventDate = new Date(e.startDate).getTime()
      const now = Date.now()
      const weekFromNow = now + 1000 * 60 * 60 * 24 * 7
      if (eventDate < now || eventDate > weekFromNow) return false
    }
    if (tab === "hackathons") {
      const tagsLower = e.tags.map((t) => t.toLowerCase())
      const titleLower = e.title.toLowerCase()
      if (!tagsLower.some((t) => t.includes("hack")) && !titleLower.includes("hack")) return false
    }
    if (tab === "workshops") {
      const tagsLower = e.tags.map((t) => t.toLowerCase())
      const titleLower = e.title.toLowerCase()
      if (!tagsLower.some((t) => t.includes("workshop")) && !titleLower.includes("workshop")) return false
    }

    if (!matchesSelectedCity(e)) return false

    if (selectedDate) {
      // Timezone-safe day window: an event passes if its UTC instant falls
      // anywhere between local 00:00 and 23:59:59.999 of the selected day.
      // Replaces the previous getDate/getMonth/getYear comparison which can
      // drift across DST boundaries and on rows stored under a different
      // server-time offset.
      if (!isOnLocalDay(e.startDate, selectedDate)) return false
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      // Wide-match: name / description / category / location / venue / city / source.
      // Anything visible on the card should be a search target — typing "san
      // francisco" finds SF events, typing "hackathon" finds hackathons,
      // typing "Dinner" finds the literal title.
      const haystack = [
        e.title,
        e.description ?? "",
        e.location ?? "",
        e.venue ?? "",
        e.city ?? "",
        e.region ?? "",
        e.source ?? "",
        ...e.tags,
      ]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    if (selectedCategories.length > 0) {
      // OR-match: event passes if it has any of the selected categories
      const tagsLower = e.tags.map((t) => t.toLowerCase())
      if (!selectedCategories.some((c) => tagsLower.includes(c.toLowerCase())))
        return false
    }

    return true
  })

  // Attach distance + apply radius filter + optionally sort by distance.
  // Virtual events skip the distance gate but stay in the list (they're location-less).
  const decorated = useMemo(() => {
    const me = userLoc.position
    return filtered.map((e) => {
      let mi: number | null = null
      if (me && typeof e.lat === "number" && typeof e.lng === "number") {
        mi = distanceMiles({ lat: me.lat, lng: me.lng }, { lat: e.lat, lng: e.lng })
      }
      return { ...e, distanceMi: mi }
    })
  }, [filtered, userLoc.position])

  // When "Closest to me" is on with no explicit radius, default to a 50-mile
  // cap so the feed actually filters by proximity instead of just sorting.
  // The radius pills (10/25/50/100/250) override this default when picked.
  const DEFAULT_CLOSEST_RADIUS_MI = 50
  const effectiveRadiusMi: number | null =
    radiusMiles ?? (sortByDistance && userLoc.position ? DEFAULT_CLOSEST_RADIUS_MI : null)

  const proximityFiltered = useMemo(() => {
    if (!effectiveRadiusMi || !userLoc.position) return decorated
    return decorated.filter((e) => {
      if (e.isVirtual) return true   // virtual events bypass the geo gate
      if (e.distanceMi == null) return false   // unlocated event → cut when radius is on
      return e.distanceMi <= effectiveRadiusMi
    })
  }, [decorated, effectiveRadiusMi, userLoc.position])

  const sorted = useMemo(() => {
    if (!sortByDistance || !userLoc.position) return proximityFiltered
    return [...proximityFiltered].sort((a, b) => {
      // Virtual events sink to the bottom when sorting by distance
      if (a.isVirtual && !b.isVirtual) return 1
      if (!a.isVirtual && b.isVirtual) return -1
      const da = a.distanceMi ?? Number.POSITIVE_INFINITY
      const db = b.distanceMi ?? Number.POSITIVE_INFINITY
      return da - db
    })
  }, [proximityFiltered, sortByDistance, userLoc.position])

  // Never show the user an empty events page on first load just because
  // their auto-detected city has zero matches. If the auto-pick produced no
  // events AND we haven't already widened, fall back to "Everywhere" once.
  useEffect(() => {
    if (loading) return
    if (autoWidened) return
    if (!autoSelectedCity) return
    if (selectedCity !== autoSelectedCity) return  // user manually changed it
    if (events.length === 0) return                 // no data at all, nothing to widen to
    if (sorted.length > 0) return                   // current filter already has matches
    setSelectedCity("all")
    setAutoWidened(true)
  }, [loading, autoWidened, autoSelectedCity, selectedCity, events.length, sorted.length])

  return (
    <div className="flex min-h-dvh">
      {/* Main content — pairs with the right-side CalendarSidebar */}
      <div className="flex-1 min-w-0">
        {/* Header — meow design dashboard pattern: floating glass top bar with
            a Perplexity-tinted-glass search field, brand-gradient 'Near me'
            pill, and a brand H1. Sticky beneath the layout's aurora. */}
        <div className="px-6 pt-4 pb-5 sticky top-0 z-30 backdrop-blur-[12px]">
          <div className="flex flex-col gap-5">
            {/* Top row: search + Near me + Submit shortcut */}
            <div className="flex items-center gap-3.5">
              <label className="field-light flex-1 rounded-[15px] px-4 py-[13px] flex items-center gap-3 cursor-text">
                <Search size={20} strokeWidth={1.8} className="text-[#5d666f] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search events, hosts, topics…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-[15px] font-medium placeholder:text-[#5d666f] focus:outline-none"
                />
              </label>
              <button
                onClick={() => { setSortByDistance(true); userLoc.request() }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-[11px] text-[14px] font-semibold transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
                  sortByDistance
                    ? "pill-on"
                    : "text-text-secondary bg-white/[0.055] border border-white/[0.11] hover:text-text-primary"
                )}
              >
                <Navigation size={15} strokeWidth={1.9} className={sortByDistance ? "text-purple" : ""} />
                Near me
              </button>
              <Link
                href="/submit"
                className="glass-2 rounded-[14px] w-12 h-12 grid place-items-center text-text-primary hover:text-purple-light transition-colors"
                aria-label="Notifications"
              >
                {/* Bell — matches the design dashboard top bar. */}
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </Link>
            </div>

            {/* H1 + sorted-by-distance meta — design's 'Closest to me' pattern */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1
                  className="font-display font-extrabold text-text-primary"
                  style={{ fontSize: "44px", letterSpacing: "-0.03em", lineHeight: 1.0 }}
                >
                  {sortByDistance ? "Closest to me" : "Discover events"}
                </h1>
                {sortByDistance && userLoc.position && (
                  <div className="flex items-center gap-2 mt-2 text-text-secondary text-[15px] font-semibold">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-mint)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                    Sorted by distance · {sorted.filter((e) => !e.isVirtual && typeof e.distanceMi === "number").length} within {effectiveRadiusMi ?? 50} mi · global events hidden
                  </div>
                )}
              </div>

              {/* Quick-filter pill row — design pattern. Click to toggle. */}
              <div className="flex gap-2 flex-wrap">
                {TABS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTab((v) => (v === t.value ? null : t.value))}
                    className={cn(
                      "rounded-full px-4 py-2 text-[13.5px] font-semibold transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
                      tab === t.value
                        ? "pill-on"
                        : "text-text-secondary bg-white/[0.055] border border-white/[0.11] hover:text-text-primary",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CITIES — restored. User asked: 'i also want to select locaitons
                as well. why did you remove it.' Same monochrome pill system. */}
            {cities.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin size={14} strokeWidth={1.5} className="text-text-muted flex-shrink-0" />
                <button
                  onClick={() => { setSelectedCity("all"); setAutoWidened(false) }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
                    selectedCity === "all"
                      ? "pill-on"
                      : "text-text-secondary bg-white/[0.055] border border-white/[0.11] hover:text-text-primary",
                  )}
                >
                  <Globe size={12} strokeWidth={1.5} />
                  Everywhere
                </button>
                <button
                  onClick={() => { setSelectedCity("virtual"); setAutoWidened(false) }}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
                    selectedCity === "virtual"
                      ? "pill-on"
                      : "text-text-secondary bg-white/[0.055] border border-white/[0.11] hover:text-text-primary",
                  )}
                >
                  Online
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => { setSelectedCity(city); setAutoWidened(false) }}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
                      selectedCity === city
                        ? "pill-on"
                        : "text-text-secondary bg-white/[0.055] border border-white/[0.11] hover:text-text-primary",
                    )}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}

            {/* CATEGORIES — restored. Monochrome pill system. */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-text-muted flex-shrink-0 mr-1">
                Categories
              </span>
              {CATEGORY_CHIPS.map((cat) => {
                const active = selectedCategories.includes(cat)
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
                      active
                        ? "pill-on"
                        : "text-text-secondary bg-white/[0.055] border border-white/[0.11] hover:text-text-primary",
                    )}
                  >
                    {cat}
                  </button>
                )
              })}
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-[11px] font-semibold text-text-muted hover:text-text-secondary transition-colors ml-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* RADIUS — only when Near me is on. */}
            {userLoc.position && sortByDistance && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-text-muted flex-shrink-0 mr-1">
                  Radius
                </span>
                {RADIUS_OPTIONS.map((mi) => (
                  <button
                    key={mi}
                    onClick={() => setRadiusMiles((v) => (v === mi ? null : mi))}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
                      radiusMiles === mi
                        ? "pill-on"
                        : "text-text-secondary bg-white/[0.055] border border-white/[0.11] hover:text-text-primary",
                    )}
                  >
                    {mi} mi
                  </button>
                ))}
                <button
                  onClick={userLoc.clear}
                  className="text-[11px] font-semibold text-text-muted hover:text-text-secondary transition-colors ml-1"
                  title="Forget my location"
                >
                  Clear
                </button>
              </div>
            )}

            {userLoc.status === "denied" && (
              <span className="text-[11px] text-red-400">
                Permission denied — enable Location in your browser settings.
              </span>
            )}
          </div>
        </div>


        {/* Single-column scrollable list — user wanted one event per row */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex flex-col gap-3 max-w-3xl">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="glass rounded-[20px] p-3 flex items-stretch gap-4 animate-pulse"
                >
                  <div className="w-[100px] h-[100px] rounded-xl bg-white/[0.04] flex-shrink-0" />
                  <div className="flex-1 flex flex-col justify-center gap-2">
                    <div className="h-3 w-20 bg-white/[0.04] rounded" />
                    <div className="h-4 w-3/4 bg-white/[0.04] rounded" />
                    <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <h3 className="font-display font-bold text-[22px] text-text-primary mb-2">No events found</h3>
              <p className="text-text-muted text-sm mb-6">
                Try adjusting your filters, or be the first to submit one.
              </p>
              <Link
                href="/submit"
                className="btn-brand !rounded-full"
              >
                Submit one
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-3xl">
              {sorted.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  description={event.description ?? undefined}
                  startDate={event.startDate}
                  location={event.location ?? undefined}
                  isVirtual={event.isVirtual}
                  registrationUrl={event.registrationUrl ?? undefined}
                  imageUrl={event.imageUrl ?? undefined}
                  tags={event.tags}
                  isFree={event.isFree}
                  source={event.source}
                  distanceMi={(event as Event & { distanceMi?: number | null }).distanceMi ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar sidebar — restored per user request. Glass-styled to
          match the rest of the dashboard. Coming Up panel uses the SAME
          city predicate as the main feed so it stays in lockstep with
          the active city pill. */}
      <CalendarSidebar
        events={events
          .filter(matchesSelectedCity)
          .map((e) => ({
            ...e,
            startDate: new Date(e.startDate),
            location: e.location ?? undefined,
          }))}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        cityLabel={selectedCity === "all" || selectedCity === "virtual" ? null : selectedCity}
      />
    </div>
  )
}
