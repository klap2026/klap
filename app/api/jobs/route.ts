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
