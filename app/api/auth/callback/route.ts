import { createServerClient, serializeCookieHeader } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config'

// Only allow redirecting back into this app after login. Must be a path that
// starts with a single '/' (rejects '//evil.com', 'https://evil.com', and
// bare hostnames like 'evil.com' that the browser would treat as external).
function safeNextPath(raw: string | null): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  try {
    // Resolving against a fixed base and checking the origin survives is a
    // reliable way to catch backslash/protocol-relative tricks the startsWith
    // check above might miss (e.g. '/\evil.com').
    const resolved = new URL(raw, 'https://internal.invalid')
    if (resolved.origin !== 'https://internal.invalid') return '/dashboard'
    return raw
  } catch {
    return '/dashboard'
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (code) {
    try {
      const redirectResponse = NextResponse.redirect(`${origin}${next}`)

      const supabase = createServerClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                redirectResponse.headers.append(
                  'Set-Cookie',
                  serializeCookieHeader(name, value, options)
                )
              })
            },
          },
        }
      )

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return redirectResponse
      }
      const msg = encodeURIComponent(error.message)
      console.error('[auth/callback] Supabase error:', error.message)
      return NextResponse.redirect(`${origin}/auth/error?reason=supabase&msg=${msg}`)
    } catch (err) {
      const msg = encodeURIComponent(err instanceof Error ? err.message : String(err))
      console.error('[auth/callback] Exception:', decodeURIComponent(msg))
      return NextResponse.redirect(`${origin}/auth/error?reason=exception&msg=${msg}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error?reason=no_code`)
}
