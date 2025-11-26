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
  { params }: { params: { id: string } }
) {
  try {
    // Delete related records first
    // Delete sessions
    await supabase
      .from('Session')
      .delete()
      .eq('userId', params.id)

    // Delete OTP codes
    await supabase
      .from('OtpCode')
      .delete()
      .eq('phone', (await supabase.from('User').select('phone').eq('id', params.id).single()).data?.phone || '')

    // Delete technician profile if exists
    await supabase
      .from('Technician')
      .delete()
      .eq('userId', params.id)

    // Delete customer profile if exists
    await supabase
      .from('Customer')
      .delete()
      .eq('userId', params.id)

    // Delete user
    const { error } = await supabase
      .from('User')
      .delete()
      .eq('id', params.id)

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
