import { NextResponse } from "next/server"
import { createServerClient, serializeCookieHeader } from "@supabase/ssr"

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const response = NextResponse.json({ ok: true })

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return [] },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options)
            )
          })
        },
      },
    })

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      if (!data.session) return NextResponse.json({ confirm: true })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return response
  } catch (err) {
    console.error("[auth/email]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
