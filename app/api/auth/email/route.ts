import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    let body: { email?: string; password?: string; mode?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { email, password, mode } = body
    if (!email || !password || !mode) {
      return NextResponse.json({ error: "Missing email, password, or mode" }, { status: 400 })
    }

    const supabase = await createClient()

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      if (!data.session) return NextResponse.json({ confirm: true })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[auth/email]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
