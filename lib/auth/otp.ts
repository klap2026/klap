import { createClient } from '@supabase/supabase-js'
import { addMinutes } from 'date-fns'
import { sendOtpSms } from '@/lib/twilio/sms'

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5')
const OTP_MODE = process.env.OTP_MODE || 'mock'

// Create a Supabase client for database operations
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

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createOtpCode(phone: string): Promise<{ code: string; mockCode?: string }> {
  const code = generateOtpCode()
  const expiresAt = addMinutes(new Date(), OTP_EXPIRY_MINUTES).toISOString()

  const { error } = await supabase
    .from('OtpCode')
    .insert({
      id: crypto.randomUUID(),
      phone,
      code,
      expiresAt,
      attempts: 0,
      verified: false,
      createdAt: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating OTP:', error)
    throw new Error('Failed to create OTP')
  }

  if (OTP_MODE === 'mock') {
    return { code, mockCode: code }
  }

  // In production, send via Twilio SMS
  if (OTP_MODE === 'production') {
    const result = await sendOtpSms(phone, code)

    if (!result.success) {
      console.error('Failed to send OTP SMS:', result.error)
      throw new Error('Failed to send OTP SMS')
    }

    console.log('OTP SMS sent successfully:', result.messageSid)
  }

  return { code }
}

export async function verifyOtpCode(phone: string, code: string): Promise<boolean> {
  const { data: otpRecords, error } = await supabase
    .from('OtpCode')
    .select('*')
    .eq('phone', phone)
    .eq('code', code)
    .eq('verified', false)
    .gte('expiresAt', new Date().toISOString())
    .order('createdAt', { ascending: false })
    .limit(1)

  if (error || !otpRecords || otpRecords.length === 0) {
    return false
  }

  const otpRecord = otpRecords[0]

  if (otpRecord.attempts >= 5) {
    return false
  }

  const { error: updateError } = await supabase
    .from('OtpCode')
    .update({
      attempts: otpRecord.attempts + 1,
      verified: true,
    })
    .eq('id', otpRecord.id)

  return !updateError
}
