import { NextResponse } from "next/server"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit"

const experienceSchema = z.object({
  type: z.enum(["WORK", "EDUCATION", "PROJECT", "CERTIFICATION", "EXTRACURRICULAR"]),
  title: z.string().min(1).max(200),
  organization: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  current: z.boolean().default(false),
  description: z.string().max(1000).optional(),
  skills: z.array(z.string()).default([]),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("userId", user.id)
      .order("current", { ascending: false })
      .order("startDate", { ascending: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("[experience/GET]", error)
    return NextResponse.json({ error: "Failed to fetch experience" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await checkRateLimit(limiters.write, `experience:${user.id}`)
    if (!rl.ok) return tooManyRequests(rl.reset)

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const result = experienceSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", issues: result.error.issues }, { status: 400 })
    }

    const d = result.data
    const { data, error } = await supabase
      .from("experiences")
      .insert({
        userId: user.id,
        type: d.type,
        title: d.title,
        organization: d.organization ?? "",
        startDate: d.startDate ?? null,
        endDate: d.endDate ?? null,
        current: d.current,
        description: d.description ?? null,
        skills: d.skills,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[experience/POST]", error)
    return NextResponse.json({ error: "Failed to create experience" }, { status: 500 })
  }
}
