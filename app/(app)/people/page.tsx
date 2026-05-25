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

  const filtered = people.filter((person) => {
    // Consider someone a "mentor" if they have work experience
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
