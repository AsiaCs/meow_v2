import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Curated community event sources — links go to active event listings, not specific past events
const FALLBACK_EVENTS = [
  {
    id: "fb-1",
    title: "Cerebral Valley AI Happy Hour",
    description: "Weekly gathering of AI founders, researchers, and enthusiasts in San Francisco. One of the most active AI communities in the Bay Area.",
    startDate: nextFriday(18),
    endDate: nextFriday(21),
    location: "San Francisco, CA",
    isVirtual: false,
    virtualLink: null,
    registrationUrl: "https://cerebralvalley.ai/events",
    imageUrl: null,
    tags: ["Machine Learning / AI", "Networking", "Entrepreneurship"],
    source: "Cerebral Valley",
    isFree: true,
    status: "APPROVED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-2",
    title: "YC Startup School — Live Sessions",
    description: "Y Combinator's free online program for founders. Weekly talks from top founders and investors. Open to anyone building a startup.",
    startDate: nextMonday(10),
    endDate: nextMonday(12),
    location: null,
    isVirtual: true,
    virtualLink: "https://www.startupschool.org",
    registrationUrl: "https://www.startupschool.org",
    imageUrl: null,
    tags: ["Entrepreneurship", "Investing", "Networking"],
    source: "Y Combinator",
    isFree: true,
    status: "APPROVED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-3",
    title: "SF Tech Week — Networking Events",
    description: "Hundreds of curated tech events across San Francisco. Founders, VCs, engineers, and operators all in one place.",
    startDate: nextMonday(9),
    endDate: nextMonday(18),
    location: "San Francisco, CA",
    isVirtual: false,
    virtualLink: null,
    registrationUrl: "https://lu.ma/sf",
    imageUrl: null,
    tags: ["Networking", "Entrepreneurship", "Software Engineering"],
    source: "Luma",
    isFree: true,
    status: "APPROVED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-4",
    title: "NYC Tech Founders Mixer",
    description: "Monthly mixer for NYC's tech founders, PMs, and investors. Great for meeting people early in their startup journey.",
    startDate: nextThursday(18),
    endDate: nextThursday(21),
    location: "New York, NY",
    isVirtual: false,
    virtualLink: null,
    registrationUrl: "https://lu.ma/nyc",
    imageUrl: null,
    tags: ["Networking", "Entrepreneurship", "Investing"],
    source: "Luma",
    isFree: true,
    status: "APPROVED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-5",
    title: "AI & ML Virtual Meetup",
    description: "Online gathering for ML practitioners and AI researchers. Talks on the latest models, research papers, and tooling.",
    startDate: nextWednesday(17),
    endDate: nextWednesday(19),
    location: null,
    isVirtual: true,
    virtualLink: "https://lu.ma/discover",
    registrationUrl: "https://lu.ma/discover",
    imageUrl: null,
    tags: ["Machine Learning / AI", "Data Science", "Networking"],
    source: "Luma",
    isFree: true,
    status: "APPROVED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-6",
    title: "VC Office Hours — Pitch Practice",
    description: "Get feedback on your pitch from active investors. Open to pre-seed and seed stage founders across all industries.",
    startDate: nextTuesday(14),
    endDate: nextTuesday(17),
    location: null,
    isVirtual: true,
    virtualLink: "https://lu.ma/discover",
    registrationUrl: "https://lu.ma/discover",
    imageUrl: null,
    tags: ["Investing", "Entrepreneurship", "Finance"],
    source: "Luma",
    isFree: true,
    status: "APPROVED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-7",
    title: "Product & Design Critique Night",
    description: "Submit your product for live critique from senior PMs and designers. A workshop format with real actionable feedback.",
    startDate: nextWednesday(18),
    endDate: nextWednesday(20),
    location: null,
    isVirtual: true,
    virtualLink: "https://lu.ma/discover",
    registrationUrl: "https://lu.ma/discover",
    imageUrl: null,
    tags: ["Product Management", "Design", "Networking"],
    source: "Luma",
    isFree: true,
    status: "APPROVED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-8",
    title: "Finance & Investing Forum — Student Edition",
    description: "Monthly virtual forum connecting students interested in IB, VC, PE, and hedge funds with practitioners in the field.",
    startDate: nextSaturday(10),
    endDate: nextSaturday(13),
    location: null,
    isVirtual: true,
    virtualLink: "https://lu.ma/discover",
    registrationUrl: "https://lu.ma/discover",
    imageUrl: null,
    tags: ["Finance", "Investing", "Networking"],
    source: "Luma",
    isFree: true,
    status: "APPROVED",
    createdAt: new Date().toISOString(),
  },
]

// Date helpers — always generate future dates relative to now
function nextWeekday(targetDay: number, hour: number): string {
  const d = new Date()
  const current = d.getDay()
  const diff = (targetDay - current + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}
function nextMonday(h: number) { return nextWeekday(1, h) }
function nextTuesday(h: number) { return nextWeekday(2, h) }
function nextWednesday(h: number) { return nextWeekday(3, h) }
function nextThursday(h: number) { return nextWeekday(4, h) }
function nextFriday(h: number) { return nextWeekday(5, h) }
function nextSaturday(h: number) { return nextWeekday(6, h) }

function matchesTags(itemTags: string[], filterTags: string[]): boolean {
  return filterTags.some((ft) =>
    itemTags.some((it) => it.toLowerCase().includes(ft.toLowerCase()))
  )
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get("tags")
    const virtualParam = searchParams.get("virtual")
    const freeParam = searchParams.get("free")
    const dateParam = searchParams.get("date")
    const filterTags = tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : []

    const supabase = await createClient()
    let query = supabase
      .from("events")
      .select("id, title, description, startDate, endDate, location, isVirtual, virtualLink, registrationUrl, imageUrl, tags, source, isFree, status, createdAt")
      .eq("status", "APPROVED")
      .gte("startDate", new Date().toISOString())
      .order("startDate")

    if (filterTags.length > 0) query = query.overlaps("tags", filterTags)
    if (virtualParam === "true") query = query.eq("isVirtual", true)
    if (freeParam === "true") query = query.eq("isFree", true)
    if (dateParam) {
      const date = new Date(dateParam)
      if (!isNaN(date.getTime())) {
        const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0)
        const dayEnd = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999)
        query = query.gte("startDate", dayStart.toISOString()).lte("startDate", dayEnd.toISOString())
      }
    }

    const { data } = await query
    const dbResults = (data ?? []) as typeof FALLBACK_EVENTS

    // Merge fallback events — deduplicate by title
    const seen = new Set(dbResults.map((e) => e.title.toLowerCase()))
    let fallback = FALLBACK_EVENTS.filter((e) => !seen.has(e.title.toLowerCase()))

    if (filterTags.length > 0) fallback = fallback.filter((e) => matchesTags(e.tags, filterTags))
    if (virtualParam === "true") fallback = fallback.filter((e) => e.isVirtual)
    if (freeParam === "true") fallback = fallback.filter((e) => e.isFree)

    const combined = [...dbResults, ...fallback]
    return NextResponse.json(combined)
  } catch (error) {
    console.error("[events/GET]", error)
    return NextResponse.json(FALLBACK_EVENTS)
  }
}
