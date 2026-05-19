import { NextResponse } from "next/server"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"

const onboardingSchema = z.object({
  interests: z.array(z.string()).min(1),
  location: z.string().optional(),
  lookingFor: z.array(z.enum(["internships", "events", "mentors"])),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const result = onboardingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", issues: result.error.issues }, { status: 400 })
    }

    const { interests, location } = result.data

    const { data, error } = await supabase
      .from("users")
      .upsert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? null,
        image: user.user_metadata?.avatar_url ?? null,
        interests,
        location: location ?? null,
        onboarded: true,
        updatedAt: new Date().toISOString(),
      }, { onConflict: "id" })
      .select("id, name, interests, location, onboarded")
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("[onboarding/POST]", error)
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 })
  }
}
