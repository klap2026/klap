import { NextResponse } from 'next/server'
import { createOtpCode } from '@/lib/auth/otp'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone || !phone.startsWith('+')) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must include country code (e.g., +972)' },
        { status: 400 }
      )
    }

    const result = await createOtpCode(phone)

    return NextResponse.json({
      success: true,
      mockCode: result.mockCode, // Only present in mock mode
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP code' },
      { status: 500 }
    )
  }
}
