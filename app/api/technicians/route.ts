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
    // Get user ID from middleware headers
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, phone, specializations, workingHours } = await request.json()

    if (!name || !specializations || !workingHours) {
      return NextResponse.json(
        { error: 'Name, specializations, and working hours are required' },
        { status: 400 }
      )
    }

    // Create technician profile
    const { data: technician, error } = await supabase
      .from('Technician')
      .insert({
        id: crypto.randomUUID(),
        userId: userId,
        name,
        phone: phone || null,
        specializations,
        workingHours,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating technician:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      technician,
    })

  } catch (error) {
    console.error('Create technician error:', error)
    return NextResponse.json(
      { error: 'Failed to create technician profile' },
      { status: 500 }
    )
  }
}

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

    // Get technician profile for current user
    const { data: technician, error } = await supabase
      .from('Technician')
      .select('*')
      .eq('userId', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { technician: null },
          { status: 200 }
        )
      }
      throw error
    }

    return NextResponse.json({
      technician,
    })

  } catch (error) {
    console.error('Get technician error:', error)
    return NextResponse.json(
      { error: 'Failed to get technician profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    // Get user ID from middleware headers
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const updateData = await request.json()

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString(),
    }

    if (updateData.name !== undefined) updates.name = updateData.name
    if (updateData.workAddress !== undefined) updates.workAddress = updateData.workAddress
    if (updateData.specializations !== undefined) updates.specializations = updateData.specializations
    if (updateData.workingHours !== undefined) updates.workingHours = updateData.workingHours

    // Update technician profile
    const { data: technician, error } = await supabase
      .from('Technician')
      .update(updates)
      .eq('userId', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating technician:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      technician,
    })

  } catch (error) {
    console.error('Update technician error:', error)
    return NextResponse.json(
      { error: 'Failed to update technician profile' },
      { status: 500 }
    )
  }
}
