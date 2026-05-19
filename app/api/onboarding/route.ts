import { NextResponse } from "next/server"
import * as z from "zod"
import { prisma } from "@/lib/db"
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const result = onboardingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { interests, location } = result.data

    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        interests,
        location,
        onboarded: true,
      },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? null,
        image: user.user_metadata?.avatar_url ?? null,
        interests,
        location,
        onboarded: true,
      },
      select: {
        id: true,
        name: true,
        interests: true,
        location: true,
        onboarded: true,
      },
    })

    return NextResponse.json(dbUser)
  } catch (error) {
    console.error("[onboarding/POST]", error)
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 })
  }
}
