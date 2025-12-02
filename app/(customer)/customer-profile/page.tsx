'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n/LanguageContext'

type Customer = {
  id: string
  name: string
  address: string
}

export default function CustomerProfilePage() {
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)

  // Edit states
  const [editingName, setEditingName] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (!data.customer) {
          router.push('/onboarding/customer')
          return
        }

        setCustomer(data.customer)
        setName(data.customer.name)
        setAddress(data.customer.address || '')
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleSave = async (field: 'name' | 'address') => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const updateData: any = {}

      if (field === 'name') {
        updateData.name = name
      } else if (field === 'address') {
        updateData.address = address
      }

      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!res.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await res.json()
      setCustomer(data.customer)

      // Exit edit mode
      if (field === 'name') setEditingName(false)
      if (field === 'address') setEditingAddress(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent-orange to-orange-600 text-white p-6 pb-8">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => router.push('/home')}
            className="mb-4 text-orange-100 hover:text-white transition-colors"
          >
            ← {t('back')}
          </button>
          <h1 className="text-2xl font-bold">{t('profile')}</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        {/* Name */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary-navy">{t('name')}</h2>
            {!editingName && (
              <button
                onClick={() => setEditingName(true)}
                className="text-accent-orange font-medium text-sm"
              >
                {t('edit')}
              </button>
            )}
          </div>

          {editingName ? (
            <div className="space-y-4">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('enterFullName')}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave('name')}
                  isLoading={saving}
                  className="flex-1"
                >
                  {t('save')}
                </Button>
                <Button
                  onClick={() => {
                    setName(customer?.name || '')
                    setEditingName(false)
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 text-lg">{customer?.name}</p>
          )}
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary-navy">{t('address')}</h2>
            {!editingAddress && (
              <button
                onClick={() => setEditingAddress(true)}
                className="text-accent-orange font-medium text-sm"
              >
                {t('edit')}
              </button>
            )}
          </div>

          {editingAddress ? (
            <div className="space-y-4">
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('address')}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-accent-orange focus:outline-none focus:ring-2 focus:ring-orange-200"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave('address')}
                  isLoading={saving}
                  className="flex-1"
                >
                  {t('save')}
                </Button>
                <Button
                  onClick={() => {
                    setAddress(customer?.address || '')
                    setEditingAddress(false)
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700">
              {customer?.address || <span className="text-gray-400 italic">Not set</span>}
            </p>
          )}
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-primary-navy mb-6">{t('settings')}</h2>

          {/* Language Switcher */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('language')}</label>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
              <button
                onClick={() => setLanguage('en')}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${language === 'en'
                    ? 'bg-white text-primary-navy shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('he')}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${language === 'he'
                    ? 'bg-white text-primary-navy shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                עב
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t border-gray-100">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-status-danger hover:bg-red-50 justify-center"
              size="lg"
            >
              <span className="mr-2">🚪</span> {t('logout')}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-inset-bottom">
        <div className="max-w-md mx-auto flex justify-around">
          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-medium">{t('home')}</span>
          </button>
          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <span className="text-2xl">📋</span>
            <span className="text-xs font-medium">{t('jobs')}</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-accent-orange">
            <span className="text-2xl">👤</span>
            <span className="text-xs font-medium">{t('profile')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
