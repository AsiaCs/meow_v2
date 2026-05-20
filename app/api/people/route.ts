import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function isRealLinkedIn(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const { hostname, pathname } = new URL(url)
    return (hostname === "linkedin.com" || hostname === "www.linkedin.com") &&
      pathname.startsWith("/in/") &&
      pathname.length > 5
  } catch {
    return false
  }
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

    let users = data ?? []

    if (mentorParam === "true") {
      users = users.filter((u: any) =>
        Array.isArray(u.experiences) && u.experiences.some((e: any) => e.type === "WORK")
      )
    }

    const shaped = users.map((user: any) => {
      const experiences = Array.isArray(user.experiences) ? user.experiences : []
      const experienceSummary = experiences.reduce((acc: Record<string, number>, exp: any) => {
        acc[exp.type] = (acc[exp.type] ?? 0) + 1
        return acc
      }, {})
      return {
        id: user.id,
        name: user.name,
        image: user.image,
        location: user.location,
        interests: user.interests,
        linkedinUrl: isRealLinkedIn(user.linkedinUrl) ? user.linkedinUrl : null,
        experienceSummary,
        experienceCount: experiences.length,
      }
    })

    return NextResponse.json(shaped)
  } catch (error) {
    console.error("[people/GET]", error)
    return NextResponse.json({ error: "Failed to fetch people" }, { status: 500 })
  }
}
