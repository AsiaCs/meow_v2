import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config'

const PROTECTED_PATHS = ['/dashboard', '/events', '/internships', '/profile', '/onboarding', '/submit', '/saved', '/sat']

export async function proxy(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch {
      // treat as unauthenticated
    }

    const isProtected = PROTECTED_PATHS.some(p => request.nextUrl.pathname.startsWith(p))
    if (isProtected && !user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    return supabaseResponse
  } catch {
    const isProtected = PROTECTED_PATHS.some(p => request.nextUrl.pathname.startsWith(p))
    if (isProtected) return NextResponse.redirect(new URL('/auth/signin', request.url))
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
