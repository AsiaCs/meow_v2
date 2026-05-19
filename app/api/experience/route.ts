import { NextResponse } from "next/server"
import * as z from "zod"
import { prisma } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"

const experienceSchema = z.object({
  type: z.enum(["WORK", "EDUCATION", "PROJECT", "CERTIFICATION", "EXTRACURRICULAR"]),
  title: z.string().min(1).max(200),
  organization: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  current: z.boolean().default(false),
  description: z.string().max(1000).optional(),
  skills: z.array(z.string()).default([]),
  url: z.string().url().optional(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const experience = await prisma.experience.findMany({
      where: { userId: user.id },
      orderBy: [{ current: "desc" }, { startDate: "desc" }],
    })

    return NextResponse.json(experience)
  } catch (error) {
    console.error("[experience/GET]", error)
    return NextResponse.json({ error: "Failed to fetch experience" }, { status: 500 })
  }
}

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

    const result = experienceSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      )
    }

    const data = result.data

    const experience = await prisma.experience.create({
      data: {
        userId: user.id,
        type: data.type,
        title: data.title,
        organization: data.organization ?? "",
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        current: data.current,
        description: data.description,
        skills: data.skills,
      },
    })

    return NextResponse.json(experience, { status: 201 })
  } catch (error) {
    console.error("[experience/POST]", error)
    return NextResponse.json({ error: "Failed to create experience" }, { status: 500 })
  }
}
