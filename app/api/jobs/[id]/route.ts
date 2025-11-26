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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { data: job, error } = await supabase
      .from('Job')
      .select(`
        *,
        Customer (
          id,
          name,
          phone,
          address
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching job:', error)
      throw error
    }

    return NextResponse.json({ job })

  } catch (error) {
    console.error('Get job error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const updates = await request.json()

    const { data: job, error } = await supabase
      .from('Job')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        Customer (
          id,
          name,
          phone,
          address
        )
      `)
      .single()

    if (error) {
      console.error('Error updating job:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      job,
    })

  } catch (error) {
    console.error('Update job error:', error)
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    )
  }
}
