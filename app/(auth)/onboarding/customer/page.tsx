'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function CustomerOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !address) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          address,
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
          <h1 className="text-3xl font-bold text-primary-navy mb-2">Welcome!</h1>
          <p className="text-gray-600 mb-8">Let's set up your profile</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Your Name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Address <span className="text-status-danger">*</span>
              </label>
              <textarea
                placeholder="Enter your address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={3}
                className="
                  w-full px-4 py-3 rounded-lg border-2 border-gray-200
                  focus:border-accent-orange focus:outline-none focus:ring-2 focus:ring-orange-200
                  text-lg
                "
              />
              <p className="mt-2 text-sm text-gray-500">
                This will be used as your default service location
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
            >
              Complete Setup
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
