'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { format, addDays, startOfWeek } from 'date-fns'

type Job = {
  id: string
  status: string
  description: string
  address: string
  scheduledStart: string | null
  Customer: {
    name: string
  }
}

type Technician = {
  id: string
  name: string
}

export default function SchedulePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [technician, setTechnician] = useState<Technician | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }))

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

        // Get all jobs for this technician
        const jobsRes = await fetch(`/api/jobs?technicianId=${techData.technician.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const jobsData = await jobsRes.json()

        if (jobsData.jobs) {
          // Filter jobs that have a scheduled time
          const scheduledJobs = jobsData.jobs.filter((job: Job) => job.scheduledStart)
          setJobs(scheduledJobs)
        }
      } catch (error) {
        console.error('Error loading schedule:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const getJobsForDay = (day: Date) => {
    return jobs.filter(job => {
      if (!job.scheduledStart) return false
      const jobDate = new Date(job.scheduledStart)
      return format(jobDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    })
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

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
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-200 mb-4 flex items-center gap-2"
          >
            <span>←</span> Back
          </button>
          <h1 className="text-2xl font-bold mb-2">Weekly Schedule</h1>
          <p className="text-blue-200 text-sm">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        {/* Week Navigation */}
        <Card className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="text-primary-navy font-semibold px-4 py-2"
          >
            ← Prev Week
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
            className="text-sm text-gray-600"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="text-primary-navy font-semibold px-4 py-2"
          >
            Next Week →
          </button>
        </Card>

        {/* Calendar Days */}
        <div className="space-y-3">
          {weekDays.map((day, index) => {
            const dayJobs = getJobsForDay(day)
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

            return (
              <Card key={index} className={isToday ? 'border-2 border-accent-orange' : ''}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-primary-navy">
                      {format(day, 'EEEE')}
                    </h3>
                    <p className="text-sm text-gray-500">{format(day, 'MMM d, yyyy')}</p>
                  </div>
                  <div className="text-sm font-semibold text-gray-600">
                    {dayJobs.length} {dayJobs.length === 1 ? 'job' : 'jobs'}
                  </div>
                </div>

                {dayJobs.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">No jobs scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {dayJobs.map(job => (
                      <div
                        key={job.id}
                        onClick={() => router.push(`/jobs/${job.id}`)}
                        className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-semibold text-primary-navy">
                            {job.Customer.name}
                          </p>
                          <p className="text-xs font-semibold text-accent-orange">
                            {job.scheduledStart && format(new Date(job.scheduledStart), 'h:mm a')}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1">{job.description}</p>
                        <p className="text-xs text-gray-500 mt-1">📍 {job.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-inset-bottom">
        <div className="max-w-md mx-auto flex justify-around">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-accent-orange">
            <span className="text-2xl">📅</span>
            <span className="text-xs font-medium">Schedule</span>
          </button>
          <button
            onClick={() => router.push('/tech-profile')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <span className="text-2xl">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  )
}
