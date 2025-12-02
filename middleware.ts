import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/send-otp', '/api/auth/verify-otp']

// Routes that require specific roles
const roleRoutes = {
  technician: ['/dashboard', '/schedule', '/jobs', '/customers', '/settings'],
  customer: ['/home', '/book', '/history'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for token in query string (development only) or cookie
  let token: string | undefined
  let tokenFromQuery = false

  // Development only: Allow auth via query string for multi-tab testing
  if (process.env.NODE_ENV === 'development') {
    const queryToken = request.nextUrl.searchParams.get('token')
    if (queryToken) {
      token = queryToken
      tokenFromQuery = true
    }
  }

  // Fall back to cookie-based auth
  if (!token) {
    token = request.cookies.get('auth-token')?.value
  }

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify token
  const payload = await verifyToken(token)

  if (!payload) {
    // Invalid token - clear cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }

  // If token came from query string in dev mode, set it as a session cookie
  // This allows navigation within the tab without needing ?token in every URL
  // Note: Cookies are shared across tabs, so the last tab you visit will set the active token
  if (tokenFromQuery && process.env.NODE_ENV === 'development') {
    // Create a response that will set the cookie
    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    })

    // Set as session cookie (expires when browser closes)
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false, // Development only
      sameSite: 'lax',
      path: '/',
      // No maxAge = session cookie
    })

    // Add user info to headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-role', payload.role || '')

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
      response,
    })
  }

  // Check role-based access
  const userRole = payload.role

  // If user has no role yet, only allow onboarding routes and API routes
  if (!userRole) {
    if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    // Add headers and continue for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-role', payload.role || '')
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Check if user is accessing a role-specific route
  for (const [role, routes] of Object.entries(roleRoutes)) {
    const isRoleRoute = routes.some((route) => pathname.startsWith(route))

    if (isRoleRoute) {
      if (userRole !== role) {
        // User is trying to access route for different role
        // Redirect to their appropriate home page
        const redirectPath = userRole === 'technician' ? '/dashboard' : '/home'
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
      break
    }
  }

  // Add user info to request headers for API routes to use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.userId)
  requestHeaders.set('x-user-role', payload.role || '')

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
