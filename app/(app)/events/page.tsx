"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, PlusCircle, MapPin, Globe, Navigation, Loader2 } from "lucide-react"
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

type FilterTab = "all" | "in-person" | "virtual" | "free"

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "In Person", value: "in-person" },
  { label: "Virtual", value: "virtual" },
  { label: "Free", value: "free" },
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
  const [tab, setTab] = useState<FilterTab>("all")
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

        // Priority: explicit ?city= → saved profile location → browser geolocation
        if (cityParam) {
          // already initialized from cityParam — user explicitly asked for this
        } else if (meData?.location) {
          const city = (meData.location as string).split(",")[0].trim()
          if (city) {
            setSelectedCity(city)
            setAutoSelectedCity(city)
          }
        } else {
          // No saved location: ask the browser for geolocation, reverse-geocode
          // via free OpenStreetMap Nominatim, set city chip silently.
          try {
            const city = await detectBrowserCity()
            if (city) {
              setSelectedCity(city)
              setAutoSelectedCity(city)
            }
          } catch { /* user denied or no support — leave on All */ }
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
    if (tab === "in-person" && e.isVirtual) return false
    if (tab === "virtual" && !e.isVirtual) return false
    if (tab === "free" && !e.isFree) return false

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

  const proximityFiltered = useMemo(() => {
    if (!radiusMiles || !userLoc.position) return decorated
    return decorated.filter((e) => {
      if (e.isVirtual) return true
      if (e.distanceMi == null) return false
      return e.distanceMi <= radiusMiles
    })
  }, [decorated, radiusMiles, userLoc.position])

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
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="border-b border-border bg-bg-surface px-6 py-6 sticky top-0 z-30">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-text-primary font-display">Events</h1>
              <Link
                href="/submit"
                className="flex items-center gap-1.5 text-sm text-purple hover:text-purple-light transition-colors"
              >
                <PlusCircle size={15} strokeWidth={1.5} />
                Submit event
              </Link>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={15}
                strokeWidth={1.5}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by name, category, or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-bg-base border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 transition-all"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                    tab === t.value
                      ? "text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                  )}
                  style={
                    tab === t.value
                      ? { background: "var(--gradient-brand)" }
                      : undefined
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Location filter */}
            {cities.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin size={13} strokeWidth={1.5} className="text-text-muted flex-shrink-0" />
                <button
                  onClick={() => { setSelectedCity("all"); setAutoWidened(false) }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                    selectedCity === "all"
                      ? "border-purple bg-purple/15 text-purple-light"
                      : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary"
                  )}
                >
                  <Globe size={11} strokeWidth={1.5} />
                  Everywhere
                </button>
                <button
                  onClick={() => { setSelectedCity("virtual"); setAutoWidened(false) }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                    selectedCity === "virtual"
                      ? "border-purple bg-purple/15 text-purple-light"
                      : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary"
                  )}
                >
                  Online
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => { setSelectedCity(city); setAutoWidened(false) }}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                      selectedCity === city
                        ? "border-purple bg-purple/15 text-purple-light"
                        : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary"
                    )}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}

            {/* Category filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-text-muted flex-shrink-0 mr-1">
                Categories
              </span>
              {CATEGORY_CHIPS.map((cat) => {
                const active = selectedCategories.includes(cat)
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                      active
                        ? "border-purple bg-purple/15 text-purple-light"
                        : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary"
                    )}
                  >
                    {cat}
                  </button>
                )
              })}
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="px-3 py-1 rounded-full text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Proximity controls — "Use my location" / sort by distance / radius */}
            <div className="flex items-center gap-2 flex-wrap">
              <Navigation
                size={13}
                strokeWidth={1.75}
                className={cn(
                  "flex-shrink-0 transition-colors",
                  userLoc.position ? "text-purple-light" : "text-text-muted",
                )}
              />
              {!userLoc.position ? (
                <button
                  onClick={userLoc.request}
                  disabled={userLoc.status === "loading"}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                    "border-purple/40 text-purple-light hover:bg-purple/10 disabled:opacity-60",
                  )}
                >
                  {userLoc.status === "loading" ? (
                    <>
                      <Loader2 size={11} className="animate-spin" />
                      Locating…
                    </>
                  ) : (
                    "Use my location"
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setSortByDistance((v) => !v)}
                    aria-pressed={sortByDistance}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                      sortByDistance
                        ? "border-purple bg-purple/15 text-purple-light"
                        : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary",
                    )}
                  >
                    Closest to me
                  </button>
                  {RADIUS_OPTIONS.map((mi) => (
                    <button
                      key={mi}
                      onClick={() => setRadiusMiles((v) => (v === mi ? null : mi))}
                      aria-pressed={radiusMiles === mi}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                        radiusMiles === mi
                          ? "border-purple bg-purple/15 text-purple-light"
                          : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary",
                      )}
                    >
                      {mi} mi
                    </button>
                  ))}
                  <button
                    onClick={userLoc.clear}
                    className="px-3 py-1 rounded-full text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
                    title="Forget my location"
                  >
                    Clear
                  </button>
                </>
              )}
              {userLoc.status === "denied" && (
                <span className="text-[11px] text-red-400">
                  Permission denied — enable Location in your browser settings.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* "We widened your filter because your city had no events" notice */}
        {autoWidened && autoSelectedCity && (
          <div className="px-6 pt-4 max-w-3xl">
            <div className="flex items-start gap-2 rounded-xl border border-purple/25 bg-purple/5 px-3 py-2 text-xs text-text-secondary">
              <MapPin size={12} strokeWidth={1.75} className="mt-0.5 flex-shrink-0 text-purple-light" />
              <span>
                No events in <span className="text-text-primary font-medium">{autoSelectedCity}</span> right now —
                showing all events instead. Tap a city chip above to narrow down.
              </span>
            </div>
          </div>
        )}

        {/* Vertical list grouped by day — Luma / Cerebral Valley pattern */}
        <div className="px-6 py-6 max-w-3xl">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-3 rounded-2xl bg-white/[0.01] animate-pulse"
                >
                  <div className="w-[112px] h-[112px] rounded-xl bg-white/[0.04]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 bg-white/[0.04] rounded" />
                    <div className="h-4 w-3/4 bg-white/[0.04] rounded" />
                    <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="text-text-primary font-semibold mb-2">No events found</h3>
              <p className="text-text-muted text-sm mb-6">
                Try adjusting your filters, or be the first to submit one.
              </p>
              <Link
                href="/submit"
                className="flex items-center gap-1.5 text-sm text-purple hover:text-purple-light transition-colors"
              >
                <PlusCircle size={15} strokeWidth={1.5} />
                Submit one →
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {groupByDay(sorted).map(({ key, label, sublabel, items }) => (
                <section key={key}>
                  <div className="flex items-baseline gap-3 mb-3 sticky top-[160px] bg-bg-base/90 backdrop-blur-sm py-2 z-10 -mx-3 px-3">
                    <h2 className="text-base font-bold text-text-primary font-display">
                      {label}
                    </h2>
                    <span className="text-xs text-text-muted uppercase tracking-wider">
                      {sublabel}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {items.map((event) => (
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
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar sidebar — Coming Up panel uses the SAME city predicate as
          the main feed. When "San Francisco" is selected, Coming Up only
          shows SF events; on "Everywhere" / no city, it shows all events. */}
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
