'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { format, isToday, isTomorrow } from 'date-fns'
import { useLanguage } from '@/lib/i18n/LanguageContext'

type Job = {
  id: string
  status: string
  description: string
  address: string
  scheduledStart: string | null
  Customer: {
    name: string
    phone: string
  }
}

type Technician = {
  id: string
  name: string
}

export default function TechnicianDashboard() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [technician, setTechnician] = useState<Technician | null>(null)
  const [todayJobs, setTodayJobs] = useState<Job[]>([])
  const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([])
  const [pendingRequests, setPendingRequests] = useState<Job[]>([])

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // Get technician profile
        const techRes = await fetch('/api/technicians', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const techData = await techRes.json()

        if (!techData.technician) {
          router.push('/onboarding/technician')
          return
        }

        setTechnician(techData.technician)

        // Get jobs
        const jobsRes = await fetch(`/api/jobs?technicianId=${techData.technician.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const jobsData = await jobsRes.json()

        if (jobsData.jobs) {
          const today: Job[] = []
          const upcoming: Job[] = []
          const pending: Job[] = []

          jobsData.jobs.forEach((job: Job) => {
            if (job.status === 'request_received' || job.status === 'slots_proposed') {
              pending.push(job)
            } else if (job.scheduledStart) {
              const startDate = new Date(job.scheduledStart)
              if (isToday(startDate)) {
                today.push(job)
              } else if (isTomorrow(startDate) || startDate > new Date()) {
                upcoming.push(job)
              }
            }
          })

          setTodayJobs(today)
          setUpcomingJobs(upcoming)
          setPendingRequests(pending)
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

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
      <div className="bg-gradient-to-br from-primary-navy to-blue-900 text-white p-6 pb-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-1">{t('greeting', { name: technician?.name || 'Technician' })}</h1>
          <p className="text-blue-200 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-primary-navy">{t('newRequests')}</h2>
              <span className="bg-accent-orange text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingRequests.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingRequests.map(job => (
                <Card
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <StatusBadge status={job.status as any} />
                    <span className="text-xs text-gray-500">New</span>
                  </div>
                  <h3 className="font-semibold text-primary-navy mb-1">{job.Customer.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{job.description}</p>
                  <p className="text-xs text-gray-500">📍 {job.address}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Today's Jobs */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-primary-navy mb-3">{t('todaySchedule')}</h2>
          {todayJobs.length === 0 ? (
            <Card className="text-center py-8">
              <div className="text-4xl mb-2">☀️</div>
              <p className="text-gray-500">{t('noJobsToday')}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayJobs.map(job => (
                <Card
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <StatusBadge status={job.status as any} />
                    {job.scheduledStart && (
                      <span className="text-sm font-semibold text-primary-navy">
                        {format(new Date(job.scheduledStart), 'h:mm a')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-primary-navy mb-1">{job.Customer.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{job.description}</p>
                  <p className="text-xs text-gray-500">📍 {job.address}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Jobs */}
        {upcomingJobs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-primary-navy mb-3">{t('upcoming')}</h2>
            <div className="space-y-3">
              {upcomingJobs.map(job => (
                <Card
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="opacity-75"
                >
                  <div className="flex items-start justify-between mb-2">
                    <StatusBadge status={job.status as any} />
                    {job.scheduledStart && (
                      <span className="text-sm font-semibold text-gray-600">
                        {format(new Date(job.scheduledStart), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-primary-navy mb-1">{job.Customer.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{job.description}</p>
                  <p className="text-xs text-gray-500">📍 {job.address}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-inset-bottom">
        <div className="max-w-md mx-auto flex justify-around">
          <button className="flex flex-col items-center gap-1 text-accent-orange">
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-medium">{t('dashboard')}</span>
          </button>
          <button
            onClick={() => router.push('/schedule')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <span className="text-2xl">📅</span>
            <span className="text-xs font-medium">{t('schedule')}</span>
          </button>
          <button
            onClick={() => router.push('/tech-profile')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <span className="text-2xl">👤</span>
            <span className="text-xs font-medium">{t('profile')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
