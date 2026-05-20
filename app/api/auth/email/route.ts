import { createServerClient, serializeCookieHeader } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"

export async function POST(request: NextRequest) {
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

    const response = NextResponse.json({ ok: true })

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.headers.append("Set-Cookie", serializeCookieHeader(name, value, options))
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
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[auth/email]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
