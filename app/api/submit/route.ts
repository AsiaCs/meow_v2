import { NextResponse } from "next/server"
import * as z from "zod"
import { prisma } from "@/lib/db"
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const result = submitEventSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      )
    }

    const data = result.data

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description ?? "",
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isVirtual: data.isVirtual,
        location: data.location,
        virtualLink: data.virtualLink,
        registrationUrl: data.registrationUrl,
        tags: data.tags,
        isFree: data.isFree,
        imageUrl: data.imageUrl,
        source: "user",
        status: "PENDING",
        submittedBy: user.id,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("[submit/POST]", error)
    return NextResponse.json({ error: "Failed to submit event" }, { status: 500 })
  }
}
