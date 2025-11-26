'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { format } from 'date-fns'

type Job = {
  id: string
  status: string
  description: string
  chatSummary: string
  address: string
  lat: number
  lng: number
  photos: string[]
  category: string | null
  scheduledStart: string | null
  scheduledEnd: string | null
  notes: string | null
  Customer: {
    id: string
    name: string
    phone: string
    address: string
  }
}

export default function JobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [job, setJob] = useState<Job | null>(null)

  useEffect(() => {
    const loadJob = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const res = await fetch(`/api/jobs/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (data.job) {
          setJob(data.job)
        }
      } catch (error) {
        console.error('Error loading job:', error)
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [params.id, router])

  const updateStatus = async (newStatus: string) => {
    if (!job) return

    setUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await res.json()
      if (data.job) {
        setJob(data.job)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const openMaps = () => {
    if (!job) return
    const url = `https://maps.google.com/?q=${job.lat},${job.lng}`
    window.open(url, '_blank')
  }

  const callCustomer = () => {
    if (!job) return
    window.location.href = `tel:${job.Customer.phone}`
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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="text-center py-8">
          <p className="text-gray-600">Job not found</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-navy to-blue-900 text-white p-6">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => router.back()}
            className="text-blue-200 mb-4 flex items-center gap-2"
          >
            <span>←</span> Back
          </button>
          <h1 className="text-2xl font-bold mb-2">Job Details</h1>
          <StatusBadge status={job.status as any} />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        {/* Customer Info */}
        <Card className="mb-4">
          <h2 className="font-bold text-primary-navy mb-3">Customer</h2>
          <div className="space-y-2">
            <p className="font-semibold text-lg">{job.Customer.name}</p>
            <div className="flex gap-2">
              <Button
                onClick={callCustomer}
                size="sm"
                className="flex-1"
              >
                📞 Call
              </Button>
              <Button
                onClick={openMaps}
                size="sm"
                variant="secondary"
                className="flex-1"
              >
                📍 Navigate
              </Button>
            </div>
          </div>
        </Card>

        {/* Job Details */}
        <Card className="mb-4">
          <h2 className="font-bold text-primary-navy mb-3">Job Information</h2>
          <div className="space-y-3">
            {job.category && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <p className="text-sm font-medium">{job.category}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm">{job.description}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Address</p>
              <p className="text-sm">{job.address}</p>
            </div>
            {job.scheduledStart && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Scheduled Time</p>
                <p className="text-sm font-semibold">
                  {format(new Date(job.scheduledStart), 'EEEE, MMMM d, yyyy • h:mm a')}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Photos */}
        {job.photos && job.photos.length > 0 && (
          <Card className="mb-4">
            <h2 className="font-bold text-primary-navy mb-3">Photos</h2>
            <div className="grid grid-cols-2 gap-2">
              {job.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Job photo ${index + 1}`}
                  className="rounded-lg w-full h-32 object-cover"
                />
              ))}
            </div>
          </Card>
        )}

        {/* Status Actions */}
        <Card>
          <h2 className="font-bold text-primary-navy mb-3">Update Status</h2>
          <div className="space-y-2">
            {job.status === 'confirmed' && (
              <Button
                onClick={() => updateStatus('en_route')}
                className="w-full"
                isLoading={updating}
              >
                🚗 Mark as En Route
              </Button>
            )}
            {job.status === 'en_route' && (
              <Button
                onClick={() => updateStatus('arrived')}
                className="w-full"
                isLoading={updating}
              >
                📍 Mark as Arrived
              </Button>
            )}
            {job.status === 'arrived' && (
              <Button
                onClick={() => updateStatus('completed')}
                className="w-full"
                variant="secondary"
                isLoading={updating}
              >
                ✅ Mark as Completed
              </Button>
            )}
            {job.status === 'completed' && (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-status-success font-semibold">Job Completed!</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
