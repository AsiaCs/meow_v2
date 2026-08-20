import { NextResponse } from "next/server"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit"

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await checkRateLimit(limiters.write, `experience:${user.id}`)
    if (!rl.ok) return tooManyRequests(rl.reset)

    const { id } = await params
    const { error } = await supabase
      .from("experiences")
      .delete()
      .eq("id", id)
      .eq("userId", user.id)

    if (error) throw error
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
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await checkRateLimit(limiters.write, `experience:${user.id}`)
    if (!rl.ok) return tooManyRequests(rl.reset)

    const { id } = await params

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const result = experienceUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", issues: result.error.issues }, { status: 400 })
    }

    const d = result.data
    const updateData: Record<string, unknown> = {}
    if (d.type !== undefined) updateData.type = d.type
    if (d.title !== undefined) updateData.title = d.title
    if (d.organization !== undefined) updateData.organization = d.organization
    if (d.startDate !== undefined) updateData.startDate = d.startDate
    if (d.endDate !== undefined) updateData.endDate = d.endDate
    if (d.current !== undefined) updateData.current = d.current
    if (d.description !== undefined) updateData.description = d.description
    if (d.skills !== undefined) updateData.skills = d.skills

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("experiences")
      .update(updateData)
      .eq("id", id)
      .eq("userId", user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("[experience/[id]/PATCH]", error)
    return NextResponse.json({ error: "Failed to update experience" }, { status: 500 })
  }
}
