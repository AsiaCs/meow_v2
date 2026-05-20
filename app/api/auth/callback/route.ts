import { createServerClient, serializeCookieHeader } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    try {
      const redirectResponse = NextResponse.redirect(`${origin}${next}`)

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
