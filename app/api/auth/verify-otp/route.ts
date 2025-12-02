import { NextResponse } from 'next/server'
import { verifyOtpCode } from '@/lib/auth/otp'
import { signToken } from '@/lib/auth/jwt'
import { setAuthCookie } from '@/lib/auth/cookies'
import { isRateLimited, clearRateLimit, RATE_LIMITS } from '@/lib/auth/rateLimit'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone and code are required' },
        { status: 400 }
      )
    }

    // Check rate limit
    const rateLimitCheck = isRateLimited(`verify-otp:${phone}`, RATE_LIMITS.verifyOtp)
    if (rateLimitCheck.limited) {
      return NextResponse.json(
        {
          error: 'Too many verification attempts. Please try again later.',
          retryAfter: rateLimitCheck.retryAfter,
        },
        { status: 429 }
      )
    }

    const isValid = await verifyOtpCode(phone, code)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 401 }
      )
    }

    // Create Supabase client
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

    // Find or create user
    let { data: users } = await supabase
      .from('User')
      .select('*')
      .eq('phone', phone)
      .limit(1)

    let user = users?.[0]

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          id: crypto.randomUUID(),
          phone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) throw createError
      user = newUser
    }

    // Generate JWT
    const token = await signToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    })

    // Create session
    await supabase.from('Session').insert({
      id: crypto.randomUUID(),
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    })

    // Clear rate limit on successful authentication
    clearRateLimit(`send-otp:${phone}`)
    clearRateLimit(`verify-otp:${phone}`)

    const response = NextResponse.json({
      success: true,
      token, // Still return token for backward compatibility during transition
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    })

    // Set HTTP-only cookie for secure authentication
    return setAuthCookie(response, token)

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}
