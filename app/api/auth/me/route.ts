import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', payload.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get technician profile if role is technician
    let technician = null
    if (user.role === 'technician') {
      const { data } = await supabase
        .from('Technician')
        .select('*')
        .eq('userId', user.id)
        .single()
      technician = data
    }

    // Get customer profile if role is customer
    let customer = null
    if (user.role === 'customer') {
      const { data } = await supabase
        .from('Customer')
        .select('*')
        .eq('userId', user.id)
        .single()
      customer = data
    }

    return NextResponse.json({
      id: user.id,
      phone: user.phone,
      role: user.role,
      technician,
      customer,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
