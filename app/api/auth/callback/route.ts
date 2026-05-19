import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('[auth/callback] code present:', !!code, 'origin:', origin)
  console.log('[auth/callback] cookies:', request.cookies.getAll().map(c => c.name))

  if (code) {
    try {
      const redirectResponse = NextResponse.redirect(`${origin}${next}`)
      console.log('[auth/callback] created redirectResponse to', `${origin}${next}`)

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      console.log('[auth/callback] env check — url:', !!supabaseUrl, 'key:', !!supabaseKey)

      const supabase = createServerClient(
        supabaseUrl!,
        supabaseKey!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                try {
                  redirectResponse.cookies.set(name, value, options)
                } catch (cookieErr) {
                  console.error('[auth/callback] cookie set error:', cookieErr)
                }
              })
            },
          },
        }
      )
      console.log('[auth/callback] supabase client created, exchanging code...')

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      console.log('[auth/callback] exchange result — error:', error?.message, 'user:', data?.user?.id)

      if (!error) {
        return redirectResponse
      }
      console.error('[auth/callback] Supabase error:', error)
    } catch (err) {
      console.error('[auth/callback] Caught exception:', err instanceof Error ? err.message : err)
      console.error('[auth/callback] Stack:', err instanceof Error ? err.stack : 'none')
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
