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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Delete related records first
    // Delete sessions
    await supabase
      .from('Session')
      .delete()
      .eq('userId', id)

    // Delete OTP codes
    await supabase
      .from('OtpCode')
      .delete()
      .eq('phone', (await supabase.from('User').select('phone').eq('id', id).single()).data?.phone || '')

    // Delete technician profile if exists
    await supabase
      .from('Technician')
      .delete()
      .eq('userId', id)

    // Delete customer profile if exists
    await supabase
      .from('Customer')
      .delete()
      .eq('userId', id)

    // Delete user
    const { error } = await supabase
      .from('User')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
