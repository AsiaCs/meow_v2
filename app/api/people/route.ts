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
  linkedinStatus: string | null   // 'verified' | 'broken' | 'inconclusive' | 'skipped' | null
  experiences: unknown
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const interestsParam = searchParams.get("interests")
    const mentorParam = searchParams.get("mentor")
    const searchParam = searchParams.get("search")

    const supabase = await createClient()
    // Try the select that includes verification status. If linkedinStatus
    // doesn't exist as a column yet, Supabase will error — fall back to the
    // narrower select. That keeps the page working before the migration is run.
    let query = supabase
      .from("users")
      .select(`id, name, image, location, interests, linkedinUrl, linkedinStatus, experiences!experiences_userId_fkey(id, type)`)
      .eq("onboarded", true)
      .order("createdAt", { ascending: false })

    if (interestsParam) {
      const interests = interestsParam.split(",").map((i) => i.trim()).filter(Boolean)
      if (interests.length > 0) query = query.overlaps("interests", interests)
    }
    if (searchParam?.trim()) query = query.ilike("name", `%${searchParam.trim()}%`)

    let { data, error } = await query

    // Retry without linkedinStatus if the column doesn't exist yet
    if (error && /column .*linkedinStatus.* does not exist/i.test(error.message)) {
      const fallback = await supabase
        .from("users")
        .select(`id, name, image, location, interests, linkedinUrl, experiences!experiences_userId_fkey(id, type)`)
        .eq("onboarded", true)
        .order("createdAt", { ascending: false })
      data = fallback.data as unknown as typeof data
      error = fallback.error
    }
    if (error) throw error

    let users = (data ?? []) as unknown as UserRow[]
    // Backfill missing column gracefully — treat as never-checked.
    for (const u of users) {
      if (u.linkedinStatus === undefined) u.linkedinStatus = null
    }

    // GATEKEEPER: never serve profiles the verifier has confirmed are broken.
    // Verified, inconclusive, skipped, and never-checked profiles all pass —
    // unverified ones fall back to the safe LinkedIn People-search URL.
    users = users.filter((u) => u.linkedinStatus !== "broken")

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
        // available target on click: saved profile URL if verified, otherwise
        // a hyper-targeted LinkedIn People-search URL.
        const contactUrl = `/api/people/${user.id}/linkedin`
        const hasSaved = isWellFormedLinkedInProfile(user.linkedinUrl)
        const isVerified = user.linkedinStatus === "verified"
        const contactLabel = isVerified
          ? "Connect on LinkedIn"
          : hasSaved
            ? "Open LinkedIn profile"
            : "Find on LinkedIn"

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
          contactVerified: isVerified,
          linkedinStatus: user.linkedinStatus ?? "pending",
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
