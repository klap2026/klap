'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Chip } from '@/components/ui/Chip'
import { Toggle } from '@/components/ui/Toggle'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const SPECIALIZATIONS = [
  { id: 'ac_repair', key: 'acRepair' as const, icon: '❄️' },
  { id: 'ac_installation', key: 'acInstallation' as const, icon: '🔧' },
  { id: 'ac_maintenance', key: 'acMaintenance' as const, icon: '🛠️' },
  { id: 'heating', key: 'heating' as const, icon: '🔥' },
  { id: 'refrigeration', key: 'refrigeration' as const, icon: '🧊' },
  { id: 'ventilation', key: 'ventilation' as const, icon: '💨' },
  { id: 'plumbing', key: 'plumbing' as const, icon: '🚰' },
  { id: 'electrical', key: 'electrical' as const, icon: '⚡' },
]

const DAYS = [
  { id: 'sun', key: 'sunday' as const },
  { id: 'mon', key: 'monday' as const },
  { id: 'tue', key: 'tuesday' as const },
  { id: 'wed', key: 'wednesday' as const },
  { id: 'thu', key: 'thursday' as const },
  { id: 'fri', key: 'friday' as const },
  { id: 'sat', key: 'saturday' as const },
]

type WorkingDay = {
  enabled: boolean
  start: string
  end: string
}

type WorkingHours = Record<string, WorkingDay>

export default function TechnicianOnboardingPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Basic Info
  const [name, setName] = useState('')

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
            <span className="text-sm font-medium text-gray-600">{t('step')} {step} {t('of')} 3</span>
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
            <h1 className="text-2xl font-bold text-primary-navy mb-2">{t('welcome')}</h1>
            <p className="text-gray-600 mb-6">{t('setupProfile')}</p>

            <div className="space-y-4">
              <Input
                label={t('yourName')}
                placeholder={t('enterFullName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mt-8">
              <Button
                onClick={handleNext}
                className="w-full"
                size="lg"
              >
                {t('next')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Specializations */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-primary-navy mb-2">{t('yourSpecializations')}</h1>
            <p className="text-gray-600 mb-6">{t('selectAllApply')}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {SPECIALIZATIONS.map(spec => (
                <Chip
                  key={spec.id}
                  label={t(spec.key)}
                  icon={spec.icon}
                  selected={selectedSpecs.includes(spec.id)}
                  onClick={() => toggleSpec(spec.id)}
                />
              ))}
            </div>

            <Input
              label={t('otherSpecialization')}
              placeholder={t('enterIfNotListed')}
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
                {t('back')}
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1"
                size="lg"
              >
                {t('next')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Working Hours */}
        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-primary-navy mb-2">{t('workingHours')}</h1>
            <p className="text-gray-600 mb-6">{t('setAvailability')}</p>

            <div className="space-y-4">
              {DAYS.map(day => (
                <div key={day.id} className="border-b border-gray-100 pb-4">
                  <Toggle
                    enabled={workingHours[day.id].enabled}
                    onChange={() => toggleDay(day.id)}
                    label={t(day.key)}
                  />

                  {workingHours[day.id].enabled && (
                    <div className="mt-3 ml-15 flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">{t('start')}</label>
                        <input
                          type="time"
                          value={workingHours[day.id].start}
                          onChange={(e) => updateDayTime(day.id, 'start', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-accent-orange focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">{t('end')}</label>
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
                {t('back')}
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                size="lg"
                isLoading={loading}
              >
                {t('completeSetup')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
