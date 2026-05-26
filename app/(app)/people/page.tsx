"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { PersonCard } from "@/components/people/person-card"
import { INTEREST_AREAS, cn } from "@/lib/utils"

interface Person {
  id: string
  name?: string | null
  image?: string | null
  location?: string | null
  interests: string[]
  experienceCount?: number
  experienceSummary?: Record<string, number>
  buildUrl?: string | null
  buildKind?: "github" | "portfolio" | null
  buildVerified?: boolean
}

type PeopleTab = "all" | "mentors" | "peers"

const TABS: { label: string; value: PeopleTab }[] = [
  { label: "All", value: "all" },
  { label: "Mentors", value: "mentors" },
  { label: "Peers", value: "peers" },
]

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<PeopleTab>("all")
  const [search, setSearch] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [buildersOnly, setBuildersOnly] = useState(false)

  useEffect(() => {
    fetch("/api/people")
      .then((r) => r.json())
      .then((data) => {
        const rawPeople = Array.isArray(data) ? data : data.people ?? []
        setPeople(rawPeople.map((person: Person) => ({
          ...person,
          interests: Array.isArray(person.interests) ? person.interests : [],
        })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    )
  }

  const filtered = people
    // "Builders only" hides anyone without a verified GitHub link
    .filter((p) => (buildersOnly ? p.buildVerified === true : true))
    .filter((person) => {
      const isMentor = (person.experienceSummary?.WORK ?? 0) > 0
      if (tab === "mentors" && !isMentor) return false
      if (tab === "peers" && isMentor) return false

      if (selectedInterests.length > 0) {
        if (!selectedInterests.some((i) => person.interests.includes(i)))
          return false
      }

      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !(person.name ?? "").toLowerCase().includes(q) &&
          !person.interests.some((i) => i.toLowerCase().includes(q))
        )
          return false
      }

      return true
    })

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <div className="border-b border-border bg-bg-surface px-6 py-6 sticky top-0 z-30">
        <div className="flex flex-col gap-4 max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-text-primary font-display">People</h1>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search
              size={15}
              strokeWidth={1.5}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by name or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-base border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 transition-all"
            />
          </div>

          {/* Tabs + Verified-only toggle */}
          <div className="flex items-center justify-between flex-wrap gap-3">
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
            <button
              onClick={() => setBuildersOnly((v) => !v)}
              aria-pressed={buildersOnly}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150",
                buildersOnly
                  ? "border-[#10b981] bg-[#10b981]/15 text-[#10b981]"
                  : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary"
              )}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.02 0 0 .97-.31 3.18 1.18A11.07 11.07 0 0 1 12 6.81c.98.01 1.98.13 2.91.39 2.21-1.49 3.18-1.18 3.18-1.18.62 1.57.23 2.73.11 3.02.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
              </svg>
              Builders only
            </button>
          </div>

          {/* Interest filter chips */}
          <div className="flex flex-wrap gap-2">
            {INTEREST_AREAS.map((area) => {
              const active = selectedInterests.includes(area)
              return (
                <button
                  key={area}
                  onClick={() => toggleInterest(area)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                    active
                      ? "border-purple bg-purple/15 text-purple-light"
                      : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary"
                  )}
                >
                  {area}
                </button>
              )
            })}
            {selectedInterests.length > 0 && (
              <button
                onClick={() => setSelectedInterests([])}
                className="px-3 py-1 rounded-full text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-6 py-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border border-white/[0.06] rounded-3xl h-48 bg-white/[0.01] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-text-primary font-semibold mb-2">No people found</h3>
            <p className="text-text-muted text-sm">
              Try adjusting your filters or clearing your interest selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((person) => (
              <PersonCard
                key={person.id}
                id={person.id}
                name={person.name ?? "Anonymous"}
                image={person.image ?? undefined}
                location={person.location ?? undefined}
                interests={person.interests}
                isMentor={(person.experienceSummary?.WORK ?? 0) > 0}
                buildUrl={person.buildUrl ?? undefined}
                buildKind={person.buildKind ?? undefined}
                buildVerified={person.buildVerified ?? false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
