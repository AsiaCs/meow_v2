import { NextResponse } from "next/server"
import * as z from "zod"
import { prisma } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"

const experienceUpdateSchema = z.object({
  type: z.enum(["WORK", "EDUCATION", "PROJECT", "CERTIFICATION", "EXTRACURRICULAR"]).optional(),
  title: z.string().min(1).max(200).optional(),
  organization: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  current: z.boolean().optional(),
  description: z.string().max(1000).optional(),
  skills: z.array(z.string()).optional(),
})

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.experience.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Experience entry not found" }, { status: 404 })
    }

    await prisma.experience.delete({ where: { id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("[experience/[id]/DELETE]", error)
    return NextResponse.json({ error: "Failed to delete experience" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.experience.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Experience entry not found" }, { status: 404 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const result = experienceUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      )
    }

    const data = result.data

    const updateData: Record<string, unknown> = {}
    if (data.type !== undefined) updateData.type = data.type
    if (data.title !== undefined) updateData.title = data.title
    if (data.organization !== undefined) updateData.organization = data.organization
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate)
    if (data.current !== undefined) updateData.current = data.current
    if (data.description !== undefined) updateData.description = data.description
    if (data.skills !== undefined) updateData.skills = data.skills

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const updated = await prisma.experience.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[experience/[id]/PATCH]", error)
    return NextResponse.json({ error: "Failed to update experience" }, { status: 500 })
  }
}
