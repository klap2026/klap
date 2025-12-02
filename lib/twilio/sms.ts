/**
 * Twilio SMS utility for sending OTP codes
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM_NUMBER = process.env.TWILIO_NUMBER

interface SendSmsOptions {
  to: string
  body: string
}

interface SendSmsResult {
  success: boolean
  messageSid?: string
  error?: string
}

/**
 * Send an SMS via Twilio API
 *
 * @param options - SMS options (to, body)
 * @returns Result indicating success or failure
 */
export async function sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
  const { to, body } = options

  if (!TWILIO_AUTH_TOKEN) {
    console.error('TWILIO_AUTH_TOKEN is not configured')
    return {
      success: false,
      error: 'Twilio is not configured',
    }
  }

  if (!TWILIO_FROM_NUMBER) {
    console.error('TWILIO_NUMBER is not configured')
    return {
      success: false,
      error: 'Twilio is not configured',
    }
  }

  try {
    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    // Prepare form data
    const formData = new URLSearchParams()
    formData.append('To', to)
    formData.append('From', TWILIO_FROM_NUMBER)
    formData.append('Body', body)

    // Basic auth credentials
    const credentials = Buffer.from(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
    ).toString('base64')

    // Send request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Twilio API error:', errorData)
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      messageSid: data.sid,
    }
  } catch (error: any) {
    console.error('Error sending SMS via Twilio:', error)
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    }
  }
}

/**
 * Send OTP code via SMS
 *
 * @param phone - Phone number with country code (e.g., +972508764115)
 * @param code - 6-digit OTP code
 */
export async function sendOtpSms(phone: string, code: string): Promise<SendSmsResult> {
  const body = `${code} is your verification code. For your security, do not share this code.`

  return sendSms({
    to: phone,
    body,
  })
}
