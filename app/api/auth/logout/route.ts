import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth/cookies'
import { verifyToken } from '@/lib/auth/jwt'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: Request) {
  try {
    // Get token from cookie or header
    const cookieToken = request.headers.get('cookie')
      ?.split(';')
      .find((c) => c.trim().startsWith('auth-token='))
      ?.split('=')[1]

    const authHeader = request.headers.get('authorization')
    const headerToken = authHeader?.replace('Bearer ', '')

    const token = cookieToken || headerToken

    if (token) {
      const payload = await verifyToken(token)

      if (payload) {
        // Invalidate session in database
        await supabase
          .from('Session')
          .delete()
          .eq('token', token)
      }
    }

    // Clear auth cookie and return success
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    return clearAuthCookie(response)
  } catch (error) {
    console.error('Logout error:', error)

    // Even if there's an error, clear the cookie
    const response = NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )

    return clearAuthCookie(response)
  }
}
