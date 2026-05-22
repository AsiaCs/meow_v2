import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { scrapeInternships, type ScrapedInternship } from "@/lib/scrapers/internships"
import { filterReachable } from "@/lib/validators/links"
import { isSpecificApplyUrl } from "@/lib/validators/specific-urls"

export const runtime = "nodejs"
export const maxDuration = 30
export const revalidate = 1800

function matchesTags(itemTags: string[], filterTags: string[]): boolean {
  return filterTags.some((ft) =>
    itemTags.some((it) => it.toLowerCase().includes(ft.toLowerCase())),
  )
}

const fetchLiveInternships = unstable_cache(
  async (interests: string[]): Promise<ScrapedInternship[]> => {
    const scraped = await scrapeInternships(interests)
    const specific = scraped.filter((i) => isSpecificApplyUrl(i.applicationUrl))
    return await filterReachable(specific, (i) => i.applicationUrl)
  },
  ["internships-live"],
  { revalidate: 1800, tags: ["internships"] },
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get("tags")
    const remoteParam = searchParams.get("remote")
    const paidParam = searchParams.get("paid")
    const filterTags = tagsParam
      ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
      : []

    // Use user interests to bias internship scraping
    let interests: string[] = filterTags
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && interests.length === 0) {
        const { data } = await supabase
          .from("users")
          .select("interests")
          .eq("id", user.id)
          .single()
        interests = ((data as any)?.interests as string[]) ?? []
      }
    } catch { /* anonymous still gets internships */ }

    let internships = await fetchLiveInternships(interests)

    // Also include any DB internships with verified URLs
    try {
      const supabase = await createClient()
      const { data: dbInternships } = await supabase
        .from("internships")
        .select("id, title, company, location, isRemote, description, applicationUrl, deadline, isPaid, salary, tags, source, sourceUrl, createdAt")
        .order("createdAt", { ascending: false })
      if (Array.isArray(dbInternships) && dbInternships.length > 0) {
        const specificDb = (dbInternships as any[]).filter((i) => isSpecificApplyUrl(i.applicationUrl))
        const validDb = await filterReachable(specificDb, (i) => i.applicationUrl)
        const seen = new Set(internships.map((i) => i.applicationUrl))
        for (const i of validDb) {
          if (!seen.has(i.applicationUrl)) {
            internships.push(i as unknown as ScrapedInternship)
          }
        }
      }
    } catch { /* skip DB on error */ }

    if (filterTags.length > 0) {
      internships = internships.filter((i) => matchesTags(i.tags ?? [], filterTags))
    }
    if (remoteParam === "true") internships = internships.filter((i) => i.isRemote)
    if (paidParam === "true") internships = internships.filter((i) => i.isPaid)

    const shaped = internships.map((i, idx) => ({
      id: (i as any).id ?? `int-${idx}-${(i.applicationUrl ?? "").slice(-12)}`,
      title: i.title,
      company: i.company,
      location: i.location ?? null,
      isRemote: i.isRemote,
      description: i.description ?? null,
      applicationUrl: i.applicationUrl,
      deadline: (i as any).deadline ?? null,
      isPaid: i.isPaid ?? null,
      salary: (i as any).salary ?? null,
      tags: i.tags ?? [],
      source: i.source,
    }))

    return NextResponse.json(shaped)
  } catch (error) {
    console.error("[internships/GET]", error)
    return NextResponse.json([])
  }
}
