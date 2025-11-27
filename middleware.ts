import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check for Supabase auth cookie (simplified check for Edge compatibility)
  const hasAuthCookie = request.cookies.getAll().some(
    (cookie) => cookie.name.includes('auth-token') || cookie.name.includes('sb-')
  )

  // Protected routes - require auth
  const protectedRoutes = [
    '/dashboard',
    '/members',
    '/companies',
    '/groups',
    '/profile',
    '/pre-register',
  ]
  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  )

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !hasAuthCookie) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Redirect authenticated users from auth page
  if (path === '/auth' && hasAuthCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
