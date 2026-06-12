"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown } from "lucide-react"
import { InternshipCard } from "@/components/internships/internship-card"
import { INTEREST_AREAS, cn } from "@/lib/utils"

interface Internship {
  id: string
  title: string
  company: string
  location?: string | null
  isRemote: boolean
  deadline?: string | null
  isPaid?: boolean | null
  salary?: string | null
  tags: string[]
  applicationUrl?: string | null
}

type FilterTab = "all" | "remote" | "paid"

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Remote", value: "remote" },
  { label: "Paid", value: "paid" },
]

export default function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>("all")
  const [search, setSearch] = useState("")
  const [selectedArea, setSelectedArea] = useState<string>("All Categories")

  useEffect(() => {
    fetch("/api/internships")
      .then((r) => r.json())
      .then((data) => {
        const rawInternships = Array.isArray(data) ? data : data.internships ?? []
        setInternships(rawInternships.map((item: Internship) => ({
          ...item,
          tags: Array.isArray(item.tags) ? item.tags : [],
        })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = internships.filter((item) => {
    if (tab === "remote" && !item.isRemote) return false
    if (tab === "paid" && !item.isPaid) return false

    if (selectedArea !== "All Categories") {
      if (!item.tags.includes(selectedArea)) return false
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      if (
        !item.title.toLowerCase().includes(q) &&
        !item.company.toLowerCase().includes(q) &&
        !item.tags.some((t) => t.toLowerCase().includes(q))
      )
        return false
    }

    return true
  })

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <div className="border-b border-border bg-bg-surface px-6 py-6 sticky top-0 z-30">
        <div className="flex flex-col gap-4 max-w-5xl mx-auto">
          <h1 className="text-xl font-bold text-text-primary font-display">Internships</h1>

          {/* Search + area filter row */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={15}
                strokeWidth={1.5}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by role, company, or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-bg-base border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 transition-all"
              />
            </div>

            {/* Interest area dropdown */}
            <div className="relative">
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="appearance-none bg-bg-base border border-border rounded-xl pl-4 pr-9 py-2.5 text-sm text-text-secondary focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 transition-all cursor-pointer"
              >
                <option value="All Categories">All Categories</option>
                {INTEREST_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  tab === t.value
                    ? "bg-text-primary text-bg-base"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-6 py-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border border-white/[0.06] rounded-3xl h-52 bg-white/[0.01] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">💼</div>
            <h3 className="text-text-primary font-semibold mb-2">No internships found</h3>
            <p className="text-text-muted text-sm">
              Try adjusting your filters. More listings are added regularly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <InternshipCard
                key={item.id}
                id={item.id}
                title={item.title}
                company={item.company}
                location={item.location ?? undefined}
                isRemote={item.isRemote}
                deadline={item.deadline ?? undefined}
                isPaid={item.isPaid ?? undefined}
                salary={item.salary ?? undefined}
                tags={item.tags}
                applicationUrl={item.applicationUrl ?? undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
