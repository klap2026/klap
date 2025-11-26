import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth/jwt'

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
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { name, phone, address, lat, lng } = await request.json()

    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      )
    }

    // Create customer profile
    const { data: customer, error } = await supabase
      .from('Customer')
      .insert({
        id: crypto.randomUUID(),
        userId: payload.userId,
        name,
        phone: phone || payload.phone,
        address,
        lat: lat || null,
        lng: lng || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      customer,
    })

  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: 'Failed to create customer profile' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get customer profile for current user
    const { data: customer, error } = await supabase
      .from('Customer')
      .select('*')
      .eq('userId', payload.userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { customer: null },
          { status: 200 }
        )
      }
      throw error
    }

    return NextResponse.json({
      customer,
    })

  } catch (error) {
    console.error('Get customer error:', error)
    return NextResponse.json(
      { error: 'Failed to get customer profile' },
      { status: 500 }
    )
  }
}
