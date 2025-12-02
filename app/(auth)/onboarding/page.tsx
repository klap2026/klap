'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function OnboardingPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const handleSelectRole = async (role: 'technician' | 'customer') => {
    const token = localStorage.getItem('token')

    if (!token) {
      router.push('/login')
      return
    }

    // Update user role
    await fetch('/api/auth/update-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    })

    // Route to role-specific onboarding
    if (role === 'technician') {
      router.push('/onboarding/technician')
    } else {
      router.push('/onboarding/customer')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-navy via-blue-900 to-primary-navy flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-primary-navy mb-2">{t('welcome')}</h1>
          <p className="text-gray-600 mb-8">{t('iAm')}</p>

          <div className="space-y-4">
            {/* Technician Card */}
            <button
              onClick={() => handleSelectRole('technician')}
              className="w-full group"
            >
              <div className="bg-gradient-to-r from-primary-navy to-blue-800 rounded-2xl p-6 shadow-lg transition-all duration-200 hover:shadow-2xl hover:scale-105 active:scale-100">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <span className="text-5xl">🔧</span>
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-2xl font-bold text-white mb-1">{t('serviceTechnician')}</h3>
                    <p className="text-blue-200 text-sm">{t('technicianDescription')}</p>
                  </div>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Customer Card */}
            <button
              onClick={() => handleSelectRole('customer')}
              className="w-full group"
            >
              <div className="bg-gradient-to-r from-accent-orange to-orange-600 rounded-2xl p-6 shadow-lg transition-all duration-200 hover:shadow-2xl hover:scale-105 active:scale-100">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <span className="text-5xl">👤</span>
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-2xl font-bold text-white mb-1">{t('customer')}</h3>
                    <p className="text-orange-100 text-sm">{t('customerDescription')}</p>
                  </div>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
