import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeStringArray } from "@/lib/profile-normalization"
import { pickBuildUrl } from "@/lib/url-helpers"

type ExperienceRow = {
  id: string
  type: string
  title?: string | null
  organization?: string | null
}

type UserRow = {
  id: string
  name: string | null
  image: string | null
  location: string | null
  interests: unknown
  githubUrl?: string | null
  portfolioUrl?: string | null
  experiences: unknown
}

const WIDE_SELECT =
  "id, name, image, location, interests, githubUrl, portfolioUrl, " +
  "experiences!experiences_userId_fkey(id, type, title, organization)"
const NARROW_SELECT =
  "id, name, image, location, interests, " +
  "experiences!experiences_userId_fkey(id, type, title, organization)"

const MISSING_COL_RE = /column .*(githubUrl|portfolioUrl).* does not exist/i

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const interestsParam = searchParams.get("interests")
    const mentorParam = searchParams.get("mentor")
    const searchParam = searchParams.get("search")

    const supabase = await createClient()
    let query = supabase
      .from("users")
      .select(WIDE_SELECT)
      .eq("onboarded", true)
      .order("createdAt", { ascending: false })

    if (interestsParam) {
      const interests = interestsParam.split(",").map((i) => i.trim()).filter(Boolean)
      if (interests.length > 0) query = query.overlaps("interests", interests)
    }
    if (searchParam?.trim()) query = query.ilike("name", `%${searchParam.trim()}%`)

    let { data, error } = await query

    // Graceful fallback if githubUrl / portfolioUrl columns don't exist yet
    if (error && MISSING_COL_RE.test(error.message)) {
      let fb = supabase
        .from("users")
        .select(NARROW_SELECT)
        .eq("onboarded", true)
        .order("createdAt", { ascending: false })
      if (interestsParam) {
        const interests = interestsParam.split(",").map((i) => i.trim()).filter(Boolean)
        if (interests.length > 0) fb = fb.overlaps("interests", interests)
      }
      if (searchParam?.trim()) fb = fb.ilike("name", `%${searchParam.trim()}%`)
      const refetch = await fb
      data = refetch.data as unknown as typeof data
      error = refetch.error
    }
    if (error) throw error

    let users = (data ?? []) as unknown as UserRow[]

    if (mentorParam === "true") {
      users = users.filter((u) =>
        Array.isArray(u.experiences) && (u.experiences as ExperienceRow[]).some((e) => e.type === "WORK")
      )
    }

    const shaped = users
      .filter((u) => !!u.name)
      .map((user) => {
        const experiences = Array.isArray(user.experiences) ? (user.experiences as ExperienceRow[]) : []
        const experienceSummary = experiences.reduce((acc: Record<string, number>, exp) => {
          acc[exp.type] = (acc[exp.type] ?? 0) + 1
          return acc
        }, {})

        // Pick best Proof-of-Build link. Verified means we have a real GitHub.
        const build = pickBuildUrl(user.githubUrl, user.portfolioUrl)

        return {
          id: user.id,
          name: user.name,
          image: user.image,
          location: user.location,
          interests: normalizeStringArray(user.interests),
          experienceSummary,
          experienceCount: experiences.length,
          buildUrl: build?.url ?? null,
          buildKind: build?.kind ?? null,      // 'github' | 'portfolio' | null
          buildVerified: build?.kind === "github",
        }
      })

    return NextResponse.json(shaped)
  } catch (error) {
    console.error("[people/GET]", error)
    return NextResponse.json({ error: "Failed to fetch people" }, { status: 500 })
  }
}
