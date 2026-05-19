import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get("tags")
    const virtualParam = searchParams.get("virtual")
    const freeParam = searchParams.get("free")
    const dateParam = searchParams.get("date")

    const supabase = await createClient()
    let query = supabase
      .from("events")
      .select("id, title, description, startDate, endDate, location, isVirtual, virtualLink, registrationUrl, imageUrl, tags, source, isFree, status, createdAt")
      .eq("status", "APPROVED")
      .order("startDate")

    if (tagsParam) {
      const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
      if (tags.length > 0) query = query.overlaps("tags", tags)
    }
    if (virtualParam === "true") query = query.eq("isVirtual", true)
    if (freeParam === "true") query = query.eq("isFree", true)
    if (dateParam) {
      const date = new Date(dateParam)
      if (!isNaN(date.getTime())) {
        const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0)
        const dayEnd = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999)
        query = query.gte("startDate", dayStart.toISOString()).lte("startDate", dayEnd.toISOString())
      }
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("[events/GET]", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
