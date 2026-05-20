import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CURATED_INTERNSHIPS, hasGoodUrl } from "@/lib/data/curated"

function matchesTags(itemTags: string[], filterTags: string[]): boolean {
  return filterTags.some((ft) =>
    itemTags.some((it) => it.toLowerCase().includes(ft.toLowerCase()))
  )
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get("tags")
    const remoteParam = searchParams.get("remote")
    const paidParam = searchParams.get("paid")
    const filterTags = tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : []

    const supabase = await createClient()
    let query = supabase
      .from("internships")
      .select("id, title, company, location, isRemote, description, applicationUrl, deadline, isPaid, salary, tags, source, sourceUrl, createdAt")
      .order("createdAt", { ascending: false })

    if (filterTags.length > 0) query = query.overlaps("tags", filterTags)
    if (remoteParam === "true") query = query.eq("isRemote", true)
    if (paidParam === "true") query = query.eq("isPaid", true)

    const { data } = await query
    const dbResults = (data ?? []).filter((i: any) => hasGoodUrl(i.applicationUrl))

    const seen = new Set(dbResults.map((i: any) => `${i.company}|${i.title}`))
    let fallback = CURATED_INTERNSHIPS.filter((f) => !seen.has(`${f.company}|${f.title}`))

    if (filterTags.length > 0) fallback = fallback.filter((f) => matchesTags(f.tags, filterTags))
    if (remoteParam === "true") fallback = fallback.filter((f) => f.isRemote)
    if (paidParam === "true") fallback = fallback.filter((f) => f.isPaid)

    return NextResponse.json([...dbResults, ...fallback])
  } catch {
    return NextResponse.json(CURATED_INTERNSHIPS)
  }
}
