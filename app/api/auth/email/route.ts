import { createServerClient, serializeCookieHeader } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"
import { limiters, clientIp, checkRateLimit, tooManyRequests } from "@/lib/ratelimit"

export async function POST(request: NextRequest) {
  try {
    // Rate limit auth attempts per IP (brute-force / credential-stuffing guard).
    const rl = await checkRateLimit(limiters.auth, `auth:${clientIp(request)}`)
    if (!rl.ok) return tooManyRequests(rl.reset)

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
      if (error) {
        // Common: a broken handle_new_user trigger on the Supabase side.
        // Surfaces as "Database error saving new user". The /supabase/
        // migrations/20260524_fix_signup.sql file in this repo fixes it.
        const msg = error.message
        if (/database error saving new user/i.test(msg)) {
          return NextResponse.json(
            {
              error:
                "Signup failed because the Supabase user-creation trigger is misconfigured. " +
                "Open Supabase → SQL Editor and run the migration at " +
                "supabase/migrations/20260524_fix_signup.sql in this repo.",
              code: "TRIGGER_BROKEN",
            },
            { status: 500 },
          )
        }
        return NextResponse.json({ error: msg }, { status: 400 })
      }

      // Defense-in-depth: even if the SQL trigger silently no-ops, manually
      // upsert the row we need. Uses the same authed client so RLS allows it
      // (or the trigger ran as SECURITY DEFINER and beat us to it — the
      // ON CONFLICT makes that a no-op).
      if (data.user) {
        await supabase
          .from("users")
          .upsert(
            {
              id: data.user.id,
              email: data.user.email!,
              onboarded: false,
              interests: [],
              updatedAt: new Date().toISOString(),
            },
            { onConflict: "id", ignoreDuplicates: false },
          )
          .then(({ error: upsertErr }) => {
            if (upsertErr) console.warn("[auth/email] users upsert", upsertErr.message)
          })
      }

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
