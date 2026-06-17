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
      {/* Header — same dashboard pattern as /events: field-light search,
          monochrome pill-on for active filter, big Urbanist H1. */}
      <div className="px-6 pt-4 pb-5 sticky top-0 z-30 backdrop-blur-[12px]">
        <div className="flex flex-col gap-5">
          {/* Top row — search + category dropdown */}
          <div className="flex items-center gap-3.5 flex-col sm:flex-row">
            <label className="field-light flex-1 w-full rounded-[15px] px-4 py-[13px] flex items-center gap-3 cursor-text">
              <Search size={20} strokeWidth={1.8} className="text-[#5d666f] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search roles, companies, skills…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-[15px] font-medium placeholder:text-[#5d666f] focus:outline-none"
              />
            </label>

            <div className="relative w-full sm:w-auto">
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="appearance-none glass-2 rounded-[15px] pl-4 pr-10 py-[13px] text-[14px] font-semibold text-text-primary focus:outline-none cursor-pointer min-w-[180px]"
              >
                {/* Inline styling on every <option> is required because native
                    select popups are OS-painted and Tailwind classes do not
                    reach them. Without this, Windows renders white text on
                    a near-white system background — unreadable. */}
                <option value="All Categories" style={{ background: "#1a102f", color: "#f5f2fc" }}>
                  All Categories
                </option>
                {INTEREST_AREAS.map((area) => (
                  <option key={area} value={area} style={{ background: "#1a102f", color: "#f5f2fc" }}>
                    {area}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                strokeWidth={1.8}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
              />
            </div>
          </div>

          {/* H1 + right-aligned tabs */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1
              className="font-display font-extrabold text-text-primary"
              style={{ fontSize: "44px", letterSpacing: "-0.03em", lineHeight: 1.0 }}
            >
              Internships
            </h1>

            <div className="flex gap-2 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
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
