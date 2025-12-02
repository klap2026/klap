import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signToken } from '@/lib/auth/jwt'
import { setAuthCookie } from '@/lib/auth/cookies'

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
