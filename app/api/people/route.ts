import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeStringArray } from "@/lib/profile-normalization"

function isWellFormedLinkedInProfile(url: string | null): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    return (
      (u.hostname === "linkedin.com" || u.hostname === "www.linkedin.com") &&
      /^\/in\/[A-Za-z0-9-]+\/?$/.test(u.pathname)
    )
  } catch {
    return false
  }
}

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

        // Always point at the server-side redirector. It picks the best
        // available target on click: saved profile URL if present, otherwise
        // a hyper-targeted "I'm Feeling Lucky" style redirect that lands on
        // the actual LinkedIn profile rather than a logged-out search wall.
        const contactUrl = `/api/people/${user.id}/linkedin`
        const hasSaved = isWellFormedLinkedInProfile(user.linkedinUrl)
        const contactLabel = hasSaved ? "Connect on LinkedIn" : "Open LinkedIn profile"

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
          contactVerified: hasSaved,
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
