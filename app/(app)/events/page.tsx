"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Search, PlusCircle, MapPin, Globe } from "lucide-react"
import { EventCard } from "@/components/events/event-card"
import { CalendarSidebar } from "@/components/events/calendar-sidebar"
import { cn } from "@/lib/utils"

interface Event {
  id: string
  title: string
  description?: string | null
  startDate: string
  location?: string | null
  isVirtual: boolean
  registrationUrl: string
  imageUrl?: string | null
  tags: string[]
  isFree: boolean
  source: string
}

type FilterTab = "all" | "in-person" | "virtual" | "free"

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "In Person", value: "in-person" },
  { label: "Virtual", value: "virtual" },
  { label: "Free", value: "free" },
]

function extractCity(location: string): string {
  return location.split(",")[0].trim()
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>("all")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCity, setSelectedCity] = useState<string>("all")

  useEffect(() => {
    // Load events and user location in parallel
    Promise.all([
      fetch("/api/events").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ]).then(([eventsData, meData]) => {
      setEvents(Array.isArray(eventsData) ? eventsData : eventsData.events ?? [])
      // Auto-select user's city if they have a saved location
      if (meData?.location) {
        const city = (meData.location as string).split(",")[0].trim()
        setSelectedCity(city)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Build city list from in-person events
  const cities = useMemo(() => {
    const citySet = new Set<string>()
    events.forEach((e) => {
      if (!e.isVirtual && e.location) citySet.add(extractCity(e.location))
    })
    return Array.from(citySet).sort()
  }, [events])

  const filtered = events.filter((e) => {
    if (tab === "in-person" && e.isVirtual) return false
    if (tab === "virtual" && !e.isVirtual) return false
    if (tab === "free" && !e.isFree) return false

    if (selectedCity !== "all") {
      if (selectedCity === "virtual") {
        if (!e.isVirtual) return false
      } else {
        if (e.isVirtual || !e.location?.toLowerCase().includes(selectedCity.toLowerCase()))
          return false
      }
    }

    if (selectedDate) {
      const eDate = new Date(e.startDate)
      if (
        eDate.getFullYear() !== selectedDate.getFullYear() ||
        eDate.getMonth() !== selectedDate.getMonth() ||
        eDate.getDate() !== selectedDate.getDate()
      )
        return false
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      if (
        !e.title.toLowerCase().includes(q) &&
        !(e.description ?? "").toLowerCase().includes(q) &&
        !e.tags.some((t) => t.toLowerCase().includes(q))
      )
        return false
    }

    return true
  })

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
                placeholder="Search events..."
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
                  onClick={() => setSelectedCity("all")}
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
                  onClick={() => setSelectedCity("virtual")}
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
                    onClick={() => setSelectedCity(city)}
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
          </div>
        </div>

        {/* Grid */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-white/[0.06] rounded-3xl h-72 bg-white/[0.01] animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  description={event.description ?? undefined}
                  startDate={event.startDate}
                  location={event.location ?? undefined}
                  isVirtual={event.isVirtual}
                  registrationUrl={event.registrationUrl}
                  imageUrl={event.imageUrl ?? undefined}
                  tags={event.tags}
                  isFree={event.isFree}
                  source={event.source}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar sidebar */}
      <CalendarSidebar
        events={events.map((e) => ({
          ...e,
          startDate: new Date(e.startDate),
          location: e.location ?? undefined,
        }))}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </div>
  )
}
