import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/events', '/internships', '/people', '/profile', '/onboarding', '/submit', '/saved']

export async function proxy(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If env vars are missing, allow public routes through and block protected ones
    if (!supabaseUrl || !supabaseKey) {
      const isProtected = PROTECTED_PATHS.some(p => request.nextUrl.pathname.startsWith(p))
      if (isProtected) return NextResponse.redirect(new URL('/auth/signin', request.url))
      return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
    // Middleware must never hard-crash — fail open for public routes
    const isProtected = PROTECTED_PATHS.some(p => request.nextUrl.pathname.startsWith(p))
    if (isProtected) return NextResponse.redirect(new URL('/auth/signin', request.url))
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
