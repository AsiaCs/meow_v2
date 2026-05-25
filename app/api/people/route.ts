import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeStringArray } from "@/lib/profile-normalization"
import { buildLinkedInSearchUrl } from "@/lib/url-helpers"

type ExperienceRow = {
  id: string
  type: string
}

type UserRow = {
  id: string
  name: string | null
  image: string | null
  location: string | null
  interests: unknown
  linkedinUrl: string | null
  experiences: unknown
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const interestsParam = searchParams.get("interests")
    const mentorParam = searchParams.get("mentor")
    const searchParam = searchParams.get("search")

    const supabase = await createClient()
    let query = supabase
      .from("users")
      .select(`id, name, image, location, interests, linkedinUrl, experiences!experiences_userId_fkey(id, type)`)
      .eq("onboarded", true)
      .order("createdAt", { ascending: false })

    if (interestsParam) {
      const interests = interestsParam.split(",").map((i) => i.trim()).filter(Boolean)
      if (interests.length > 0) query = query.overlaps("interests", interests)
    }
    if (searchParam?.trim()) query = query.ilike("name", `%${searchParam.trim()}%`)

    const { data, error } = await query
    if (error) throw error

    let users = (data ?? []) as unknown as UserRow[]

    if (mentorParam === "true") {
      users = users.filter((u) =>
        Array.isArray(u.experiences) && (u.experiences as ExperienceRow[]).some((e) => e.type === "WORK")
      )
    }

    const shaped = users
      // Only include people with at least a name (so we can build a search URL)
      .filter((u) => !!u.name)
      .map((user) => {
        const experiences = Array.isArray(user.experiences) ? user.experiences as ExperienceRow[] : []
        const experienceSummary = experiences.reduce((acc: Record<string, number>, exp) => {
          acc[exp.type] = (acc[exp.type] ?? 0) + 1
          return acc
        }, {})

        // We can't HEAD-check LinkedIn URLs (they block bots), so syntactic
        // validity is not enough — seed and fake URLs pass the format test
        // and still 404 on LinkedIn. Until we add a real verification signal
        // (LinkedIn OAuth, manual confirmation, etc.), ALL users get the
        // People-search URL. It's guaranteed to land on a real LinkedIn page.
        const contactUrl = buildLinkedInSearchUrl(user.name)
        const contactLabel = "Search on LinkedIn"

        return {
          id: user.id,
          name: user.name,
          image: user.image,
          location: user.location,
          interests: normalizeStringArray(user.interests),
          experienceSummary,
          experienceCount: experiences.length,
          contactUrl,
          contactLabel,
          contactVerified: false,
        }
      })
      // Drop anyone where we couldn't build a contact link (defensive — should never happen if name exists)
      .filter((u) => !!u.contactUrl)

    return NextResponse.json(shaped)
  } catch (error) {
    console.error("[people/GET]", error)
    return NextResponse.json({ error: "Failed to fetch people" }, { status: 500 })
  }
}
