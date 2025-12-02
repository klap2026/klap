import { NextResponse } from 'next/server'
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
    // Get user ID from middleware headers
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
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
