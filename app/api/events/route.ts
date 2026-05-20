import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCuratedEvents, hasGoodUrl } from "@/lib/data/curated"

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
    const dbResults = (data ?? []).filter((e: any) => hasGoodUrl(e.registrationUrl))

    const curated = getCuratedEvents()
    const seen = new Set(dbResults.map((e: any) => e.title.toLowerCase()))
    let fallback = curated.filter((e) => !seen.has(e.title.toLowerCase()))

    if (filterTags.length > 0) fallback = fallback.filter((e) => matchesTags(e.tags, filterTags))
    if (virtualParam === "true") fallback = fallback.filter((e) => e.isVirtual)
    if (freeParam === "true") fallback = fallback.filter((e) => e.isFree)

    return NextResponse.json([...dbResults, ...fallback])
  } catch {
    return NextResponse.json(getCuratedEvents())
  }
}
