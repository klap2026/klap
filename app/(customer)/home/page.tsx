'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { format } from 'date-fns'
import { useLanguage } from '@/lib/i18n/LanguageContext'

type Job = {
  id: string
  status: string
  description: string
  address: string
  scheduledStart: string | null
  createdAt: string
}

type Customer = {
  id: string
  name: string
  address: string
}

export default function CustomerHome() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // Get customer profile
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (!data.customer) {
          router.push('/onboarding/customer')
          return
        }

        setCustomer(data.customer)

        // Get customer's jobs
        const jobsRes = await fetch(`/api/jobs?customerId=${data.customer.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const jobsData = await jobsRes.json()

        if (jobsData.jobs) {
          setJobs(jobsData.jobs)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      alert('Please describe the service you need')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: customer?.id,
          description: description.trim(),
          address: customer?.address,
          lat: 32.0853, // Default Tel Aviv coordinates
          lng: 34.7818,
        })
      })

      if (!res.ok) throw new Error('Failed to create job')

      const data = await res.json()

      // Add new job to the list
      setJobs([data.job, ...jobs])
      setDescription('')
      setShowRequestForm(false)

    } catch (error) {
      console.error('Error requesting service:', error)
      alert('Failed to request service. Please try again.')
    } finally {
      setSubmitting(false)
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent-orange to-orange-600 text-white p-6 pb-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-1">{t('greeting', { name: customer?.name || 'Customer' })}</h1>
          <p className="text-orange-100 text-sm">Request service and track your jobs</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        {/* Request Service Button */}
        {!showRequestForm && (
          <Card className="mb-6 text-center py-6">
            <div className="text-5xl mb-3">🔧</div>
            <h2 className="text-lg font-bold text-primary-navy mb-2">{t('needService')}</h2>
            <p className="text-sm text-gray-600 mb-4">{t('serviceDescription')}</p>
            <Button onClick={() => setShowRequestForm(true)} size="lg">
              {t('requestService')}
            </Button>
          </Card>
        )}

        {/* Request Service Form */}
        {showRequestForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-bold text-primary-navy mb-4">{t('requestService')}</h2>
            <form onSubmit={handleRequestService}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('serviceAddress')}
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  📍 {customer?.address}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('whatNeed')} <span className="text-status-danger">*</span>
                </label>
                <textarea
                  placeholder="Describe the service you need (e.g., 'AC not cooling', 'Need AC installation')"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-accent-orange focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowRequestForm(false)
                    setDescription('')
                  }}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" isLoading={submitting} className="flex-1">
                  {t('submit')}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Job History */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-primary-navy mb-3">{t('yourJobs')}</h2>

          {jobs.length === 0 ? (
            <Card className="text-center py-8">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-gray-500">{t('noRequests')}</p>
              <p className="text-sm text-gray-400 mt-1">Your job history will appear here</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <Card key={job.id}>
                  <div className="flex items-start justify-between mb-2">
                    <StatusBadge status={job.status as any} />
                    <span className="text-xs text-gray-500">
                      {format(new Date(job.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{job.description}</p>
                  <p className="text-xs text-gray-500">📍 {job.address}</p>
                  {job.scheduledStart && (
                    <p className="text-xs font-semibold text-accent-orange mt-2">
                      Scheduled: {format(new Date(job.scheduledStart), 'MMM d, h:mm a')}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-inset-bottom">
        <div className="max-w-md mx-auto flex justify-around">
          <button className="flex flex-col items-center gap-1 text-accent-orange">
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-medium">{t('home')}</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <span className="text-2xl">📋</span>
            <span className="text-xs font-medium">{t('jobs')}</span>
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              router.push('/login')
            }}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <span className="text-2xl">🚪</span>
            <span className="text-xs font-medium">{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
