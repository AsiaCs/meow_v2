"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { MagnifyingGlass as Search, CaretDown as ChevronDown, ArrowsClockwise as RefreshCw } from "@phosphor-icons/react"
import { InternshipCard } from "@/components/internships/internship-card"
import { INTEREST_AREAS, cn } from "@/lib/utils"
import { fetcher, swrDefaults } from "@/lib/swr"

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
  // SWR caches across navigations + dedupes; the shared edge cache handles load.
  const { data, error, isLoading, mutate } = useSWR<Internship[] | { internships: Internship[] }>(
    "/api/internships",
    fetcher,
    swrDefaults,
  )
  const internships = useMemo<Internship[]>(() => {
    const raw = Array.isArray(data) ? data : data?.internships ?? []
    return raw.map((item) => ({ ...item, tags: Array.isArray(item.tags) ? item.tags : [] }))
  }, [data])
  const loading = isLoading

  const [tab, setTab] = useState<FilterTab>("all")
  const [search, setSearch] = useState("")
  const [selectedArea, setSelectedArea] = useState<string>("All Categories")

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
      {/* Header — same dashboard pattern as /events: flat bordered search,
          near-black active filter chip. */}
      <div className="px-6 pt-4 pb-5 sticky top-0 z-30 bg-bg-base border-b border-border-subtle">
        <div className="flex flex-col gap-5">
          {/* Top row — search + category dropdown */}
          <div className="flex items-center gap-3.5 flex-col sm:flex-row">
            <label className="flex-1 w-full rounded-panel px-4 py-[13px] flex items-center gap-3 cursor-text border border-border-subtle bg-bg-raised">
              <Search size={20} className="text-text-muted flex-shrink-0" />
              <input
                type="text"
                placeholder="Search roles, companies, skills…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-body font-medium text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </label>

            <div className="relative w-full sm:w-auto">
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                // Follow the page's mode — see time-picker.tsx's NativeSelect
                // for the same call (the design system ships both now).
                style={{ colorScheme: "light dark" }}
                className="appearance-none rounded-panel pl-4 pr-10 py-[13px] text-body font-semibold text-text-primary focus:outline-none cursor-pointer min-w-[180px] border border-border-subtle bg-bg-raised"
              >
                <option value="All Categories">All Categories</option>
                {INTEREST_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
              />
            </div>
          </div>

          {/* H1 + right-aligned tabs */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="font-display text-heading-l text-text-primary">
              Internships
            </h1>

            <div className="flex gap-2 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "rounded-control px-4 py-2 text-meta font-semibold transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
                    tab === t.value
                      ? "bg-bg-inverse text-text-inverse border-transparent"
                      : "text-text-secondary bg-bg-raised border border-border-subtle hover:text-text-primary",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
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
                className="border border-border-subtle rounded-panel h-52 bg-bg-raised animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h3 className="text-text-primary font-semibold mb-2">Couldn&apos;t load internships</h3>
            <p className="text-text-muted text-body mb-5 max-w-sm">
              Something went wrong reaching our servers. Check your connection and try again.
            </p>
            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 rounded-panel border border-border-subtle bg-bg-raised px-4 py-2.5 text-body font-medium text-text-primary transition-colors hover:bg-bg-raised cursor-pointer"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h3 className="text-text-primary font-semibold mb-2">No internships found</h3>
            <p className="text-text-muted text-body">
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
