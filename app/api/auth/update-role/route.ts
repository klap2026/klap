import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signToken } from '@/lib/auth/jwt'
import { setAuthCookie } from '@/lib/auth/cookies'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    // Read token from cookie (set by middleware in headers)
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limit by user ID (5 requests per minute)
    const rateLimitResult = checkRateLimit(`update-role:${userId}`, {
      windowMs: 60000, // 1 minute
      max: 5,
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      )
    }

    const { role } = await request.json()

    if (role !== 'technician' && role !== 'customer') {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const { data: user, error } = await supabase
      .from('User')
      .update({ role, updatedAt: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Generate new JWT with updated role
    const token = await signToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    })

    const response = NextResponse.json({ success: true, user })

    // Update cookie with new JWT containing the role
    return setAuthCookie(response, token)
  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}
