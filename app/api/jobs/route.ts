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

    const { searchParams } = new URL(request.url)
    const technicianId = searchParams.get('technicianId')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')

    let query = supabase
      .from('Job')
      .select(`
        *,
        Customer (*),
        Technician (*)
      `)
      .order('createdAt', { ascending: false })

    if (technicianId) {
      query = query.eq('technicianId', technicianId)
    }

    if (customerId) {
      query = query.eq('customerId', customerId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Error fetching jobs:', error)
      throw error
    }

    return NextResponse.json({ jobs })

  } catch (error) {
    console.error('Get jobs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

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

    const {
      customerId,
      description,
      address,
      lat,
      lng,
      photos,
      category
    } = await request.json()

    if (!customerId || !description || !address) {
      return NextResponse.json(
        { error: 'Customer ID, description, and address are required' },
        { status: 400 }
      )
    }

    // Verify the user owns this customer ID
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('userId')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (customer.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this customer' },
        { status: 403 }
      )
    }

    const { data: job, error } = await supabase
      .from('Job')
      .insert({
        id: crypto.randomUUID(),
        customerId,
        description,
        chatSummary: description,
        address,
        lat: lat || 0,
        lng: lng || 0,
        photos: photos || [],
        category: category || null,
        status: 'request_received',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating job:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      job,
    })

  } catch (error) {
    console.error('Create job error:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
