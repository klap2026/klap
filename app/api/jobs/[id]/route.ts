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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
          address,
          userId
        ),
        Technician (
          id,
          userId
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching job:', error)
      throw error
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this job (either as customer or assigned technician)
    const isCustomer = job.Customer?.userId === userId
    const isTechnician = job.Technician?.userId === userId

    if (!isCustomer && !isTechnician) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this job' },
        { status: 403 }
      )
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
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const updates = await request.json()

    // First, fetch the job to verify access
    const { data: existingJob, error: fetchError } = await supabase
      .from('Job')
      .select(`
        *,
        Customer (
          id,
          userId
        ),
        Technician (
          id,
          userId
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this job (either as customer or assigned technician)
    const isCustomer = existingJob.Customer?.userId === userId
    const isTechnician = existingJob.Technician?.userId === userId

    if (!isCustomer && !isTechnician) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this job' },
        { status: 403 }
      )
    }

    // Now update the job
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
