import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get("tags")
    const remoteParam = searchParams.get("remote")
    const paidParam = searchParams.get("paid")

    const supabase = await createClient()
    let query = supabase
      .from("internships")
      .select("id, title, company, location, isRemote, description, applicationUrl, deadline, isPaid, salary, tags, source, sourceUrl, createdAt")
      .order("createdAt", { ascending: false })

    if (tagsParam) {
      const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
      if (tags.length > 0) query = query.overlaps("tags", tags)
    }
    if (remoteParam === "true") query = query.eq("isRemote", true)
    if (paidParam === "true") query = query.eq("isPaid", true)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("[internships/GET]", error)
    return NextResponse.json({ error: "Failed to fetch internships" }, { status: 500 })
  }
}
