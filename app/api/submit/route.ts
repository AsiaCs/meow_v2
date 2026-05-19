import { NextResponse } from "next/server"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"

const submitEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isVirtual: z.boolean(),
  location: z.string().max(200).optional(),
  virtualLink: z.string().url().optional(),
  registrationUrl: z.string().url(),
  tags: z.array(z.string()).min(1).max(5),
  isFree: z.boolean(),
  imageUrl: z.string().url().optional(),
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

    const result = submitEventSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", issues: result.error.issues }, { status: 400 })
    }

    const d = result.data
    const { data, error } = await supabase
      .from("events")
      .insert({
        title: d.title,
        description: d.description ?? "",
        startDate: d.startDate,
        endDate: d.endDate ?? null,
        isVirtual: d.isVirtual,
        location: d.location ?? null,
        virtualLink: d.virtualLink ?? null,
        registrationUrl: d.registrationUrl,
        tags: d.tags,
        isFree: d.isFree,
        imageUrl: d.imageUrl ?? null,
        source: "user",
        status: "PENDING",
        submittedBy: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[submit/POST]", error)
    return NextResponse.json({ error: "Failed to submit event" }, { status: 500 })
  }
}
