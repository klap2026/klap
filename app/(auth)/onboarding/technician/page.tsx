'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Chip } from '@/components/ui/Chip'
import { Toggle } from '@/components/ui/Toggle'

const SPECIALIZATIONS = [
  { id: 'ac_repair', label: 'AC Repair', icon: '❄️' },
  { id: 'ac_installation', label: 'AC Installation', icon: '🔧' },
  { id: 'ac_maintenance', label: 'AC Maintenance', icon: '🛠️' },
  { id: 'heating', label: 'Heating', icon: '🔥' },
  { id: 'refrigeration', label: 'Refrigeration', icon: '🧊' },
  { id: 'ventilation', label: 'Ventilation', icon: '💨' },
  { id: 'plumbing', label: 'Plumbing', icon: '🚰' },
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
]

const DAYS = [
  { id: 'sun', label: 'Sunday' },
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' },
  { id: 'fri', label: 'Friday' },
  { id: 'sat', label: 'Saturday' },
]

type WorkingDay = {
  enabled: boolean
  start: string
  end: string
}

type WorkingHours = Record<string, WorkingDay>

export default function TechnicianOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Basic Info
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2: Specializations
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])
  const [otherSpec, setOtherSpec] = useState('')

  // Step 3: Working Hours
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    sun: { enabled: true, start: '08:00', end: '18:00' },
    mon: { enabled: true, start: '08:00', end: '18:00' },
    tue: { enabled: true, start: '08:00', end: '18:00' },
    wed: { enabled: true, start: '08:00', end: '18:00' },
    thu: { enabled: true, start: '08:00', end: '18:00' },
    fri: { enabled: false, start: '08:00', end: '18:00' },
    sat: { enabled: false, start: '08:00', end: '18:00' },
  })

  const toggleSpec = (specId: string) => {
    setSelectedSpecs(prev =>
      prev.includes(specId)
        ? prev.filter(s => s !== specId)
        : [...prev, specId]
    )
  }

  const toggleDay = (dayId: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], enabled: !prev[dayId].enabled }
    }))
  }

  const updateDayTime = (dayId: string, field: 'start' | 'end', value: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], [field]: value }
    }))
  }

  const handleNext = () => {
    if (step === 1 && !name) {
      alert('Please enter your name')
      return
    }
    if (step === 2 && selectedSpecs.length === 0 && !otherSpec) {
      alert('Please select at least one specialization')
      return
    }
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const specializations = [...selectedSpecs]
      if (otherSpec) {
        specializations.push(otherSpec)
      }

      const response = await fetch('/api/technicians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          specializations,
          workingHours,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create profile')
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating technician profile:', error)
      alert('Failed to create profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step} of 3</span>
            <span className="text-sm font-medium text-accent-orange">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-orange transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-primary-navy mb-2">Welcome, Technician!</h1>
            <p className="text-gray-600 mb-6">Let's set up your profile</p>

            <div className="space-y-4">
              <Input
                label="Your Name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Contact Phone (optional)"
                type="tel"
                placeholder="+972501234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="mt-8">
              <Button
                onClick={handleNext}
                className="w-full"
                size="lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Specializations */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-primary-navy mb-2">Your Specializations</h1>
            <p className="text-gray-600 mb-6">Select all that apply</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {SPECIALIZATIONS.map(spec => (
                <Chip
                  key={spec.id}
                  label={spec.label}
                  icon={spec.icon}
                  selected={selectedSpecs.includes(spec.id)}
                  onClick={() => toggleSpec(spec.id)}
                />
              ))}
            </div>

            <Input
              label="Other Specialization"
              placeholder="Enter if not listed above"
              value={otherSpec}
              onChange={(e) => setOtherSpec(e.target.value)}
            />

            <div className="mt-8 flex gap-3">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="flex-1"
                size="lg"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1"
                size="lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Working Hours */}
        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-primary-navy mb-2">Working Hours</h1>
            <p className="text-gray-600 mb-6">Set your availability</p>

            <div className="space-y-4">
              {DAYS.map(day => (
                <div key={day.id} className="border-b border-gray-100 pb-4">
                  <Toggle
                    enabled={workingHours[day.id].enabled}
                    onChange={() => toggleDay(day.id)}
                    label={day.label}
                  />

                  {workingHours[day.id].enabled && (
                    <div className="mt-3 ml-15 flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Start</label>
                        <input
                          type="time"
                          value={workingHours[day.id].start}
                          onChange={(e) => updateDayTime(day.id, 'start', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-accent-orange focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">End</label>
                        <input
                          type="time"
                          value={workingHours[day.id].end}
                          onChange={(e) => updateDayTime(day.id, 'end', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-accent-orange focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="flex-1"
                size="lg"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                size="lg"
                isLoading={loading}
              >
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
