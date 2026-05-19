import { NextResponse } from "next/server"
import * as z from "zod"
import { prisma } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        location: true,
        interests: true,
        onboarded: true,
        experiences: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(dbUser)
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const result = profileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      )
    }

    const data = result.data

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.location !== undefined) updateData.location = data.location
    if (data.interests !== undefined) updateData.interests = data.interests

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        location: true,
        interests: true,
        image: true,
        onboarded: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("[profile/PATCH]", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
