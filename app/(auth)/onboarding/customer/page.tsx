'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete'
import { ParsedAddress } from '@/lib/hooks'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function CustomerOnboardingPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [addressData, setAddressData] = useState<ParsedAddress | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !addressData) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Cookie is sent automatically - no need to check token
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          address: addressData.formattedAddress,
          lat: addressData.lat,
          lng: addressData.lng,
          city: addressData.city,
          street: addressData.street,
          streetNumber: addressData.streetNumber,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create profile')
      }

      router.push('/home')
    } catch (error) {
      console.error('Error creating customer profile:', error)
      alert('Failed to create profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-primary-navy mb-2">{t('welcome')}</h1>
          <p className="text-gray-600 mb-8">{t('setupProfile')}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t('yourName')}
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <AddressAutocomplete
              label={t('defaultAddress')}
              placeholder="הזן כתובת..."
              onSelect={(address) => setAddressData(address)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
            >
              {t('completeSetup')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
