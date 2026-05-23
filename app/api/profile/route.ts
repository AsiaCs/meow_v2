import { NextResponse } from "next/server"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, image, location, interests, onboarded, experiences(*)")
      .eq("id", user.id)
      .single()

    if (error || !data) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Always return a stable shape — interests/experiences default to [] so the
    // client never has to defend against undefined.
    const shaped = {
      id: (data as any).id,
      name: (data as any).name ?? null,
      email: (data as any).email ?? user.email ?? null,
      image: (data as any).image ?? null,
      location: (data as any).location ?? null,
      onboarded: Boolean((data as any).onboarded),
      interests: Array.isArray((data as any).interests) ? (data as any).interests : [],
      experiences: Array.isArray((data as any).experiences) ? (data as any).experiences : [],
    }
    return NextResponse.json(shaped)
  } catch (error) {
    console.error("[profile/GET]", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z.string().max(100).optional(),
  interests: z.array(z.string()).optional(),
})

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const result = profileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", issues: result.error.issues }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (result.data.name !== undefined) updateData.name = result.data.name
    if (result.data.location !== undefined) updateData.location = result.data.location
    if (result.data.interests !== undefined) updateData.interests = result.data.interests

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select("id, name, location, interests, image, onboarded")
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("[profile/PATCH]", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
