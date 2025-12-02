'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [isLoading, setIsLoading] = useState(false)
  const [mockCode, setMockCode] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSendOtp = async () => {
    if (phoneNumber.length < 8) {
      setError('Please enter a valid phone number')
      return
    }

    const phone = `+97205${phoneNumber}`

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      if (data.mockCode) {
        setMockCode(data.mockCode)
      }

      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

    // Auto-advance to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && value && newOtp.every(d => d)) {
      handleVerifyOtp(newOtp.join(''))
    }
  }

  const handleVerifyOtp = async (code?: string) => {
    const otpCode = code || otp.join('')

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')

    const phone = `+97205${phoneNumber}`

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Invalid code')
      }

      // Token is automatically set as HTTP-only cookie by the server
      // No need to store in localStorage (security improvement)

      // Route based on user role
      if (!data.user.role) {
        router.push('/onboarding')
      } else if (data.user.role === 'technician') {
        router.push('/dashboard')
      } else {
        router.push('/home')
      }
    } catch (err: any) {
      setError(err.message)
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0')?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-navy via-blue-900 to-primary-navy flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-4">
            <div className="w-16 h-16 bg-accent-orange rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🔧</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Klap</h1>
          <p className="text-blue-200 text-lg">Field Technician Scheduling</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {step === 'phone' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-primary-navy mb-2">{t('welcome')}</h2>
                <p className="text-gray-600">{t('enterPhonePrompt')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('phoneNumber')}
                </label>
                <div className="flex gap-2" dir="ltr">
                  <div className="bg-gray-100 px-4 py-3 rounded-lg border-2 border-gray-200 text-lg font-medium text-gray-700 flex items-center">
                    05
                  </div>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 8) {
                        setPhoneNumber(value)
                      }
                    }}
                    placeholder="8764115"
                    error={error}
                    disabled={isLoading}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button
                onClick={handleSendOtp}
                isLoading={isLoading}
                className="w-full"
                size="lg"
              >
                {t('sendCode')}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-primary-navy mb-2">{t('enterCode')}</h2>
                <p className="text-gray-600">
                  {t('codeSentTo')}<br />
                  <span className="font-semibold text-primary-navy" dir="ltr">05-{phoneNumber}</span>
                </p>
              </div>

              <div className="flex gap-2 justify-center" dir="ltr">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && index > 0) {
                        const prevInput = document.getElementById(`otp-${index - 1}`)
                        prevInput?.focus()
                      }
                    }}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-accent-orange focus:outline-none focus:ring-2 focus:ring-orange-200"
                    disabled={isLoading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && <p className="text-status-danger text-sm text-center">{error}</p>}

              <Button
                onClick={() => handleVerifyOtp()}
                isLoading={isLoading}
                className="w-full"
                size="lg"
              >
                {t('verify')}
              </Button>

              <button
                onClick={() => {
                  setStep('phone')
                  setOtp(['', '', '', '', '', ''])
                  setError('')
                  setMockCode(null)
                }}
                className="w-full text-sm text-gray-600 hover:text-primary-navy transition-colors"
                disabled={isLoading}
              >
                {t('changePhoneNumber')}
              </button>
            </div>
          )}
        </div>

        {/* Mock OTP Modal */}
        <Modal
          isOpen={!!mockCode}
          onClose={() => setMockCode(null)}
          title="🧪 Development Mode"
        >
          <div className="space-y-4">
            <p className="text-gray-600">Your verification code is:</p>
            <div className="bg-accent-orange/10 border-2 border-accent-orange rounded-xl p-6">
              <p className="text-4xl font-mono font-bold text-center text-accent-orange tracking-wider">
                {mockCode}
              </p>
            </div>
            <p className="text-sm text-gray-500 text-center">
              This code is only shown in development mode
            </p>
            <Button onClick={() => setMockCode(null)} className="w-full">
              Got it
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  )
}
