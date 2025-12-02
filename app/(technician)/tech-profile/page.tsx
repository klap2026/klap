'use client'

import { useEffect, useState } from 'react'
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

type Technician = {
  id: string
  name: string
  workAddress: string | null
  specializations: string[]
  workingHours: WorkingHours
}

export default function TechnicianProfilePage() {
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [technician, setTechnician] = useState<Technician | null>(null)

  // Edit states
  const [editingName, setEditingName] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [editingSpecs, setEditingSpecs] = useState(false)
  const [editingHours, setEditingHours] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [workAddress, setWorkAddress] = useState('')
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])
  const [workingHours, setWorkingHours] = useState<WorkingHours>({})

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/technicians')
        const data = await res.json()

        if (!data.technician) {
          router.push('/onboarding/technician')
          return
        }

        setTechnician(data.technician)
        setName(data.technician.name)
        setWorkAddress(data.technician.workAddress || '')
        setSelectedSpecs(data.technician.specializations || [])
        setWorkingHours(data.technician.workingHours || {})
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleSave = async (field: 'name' | 'address' | 'specs' | 'hours') => {
    setSaving(true)
    try {
      const updateData: any = {}

      if (field === 'name') {
        updateData.name = name
      } else if (field === 'address') {
        updateData.workAddress = workAddress
      } else if (field === 'specs') {
        updateData.specializations = selectedSpecs
      } else if (field === 'hours') {
        updateData.workingHours = workingHours
      }

      const res = await fetch('/api/technicians', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (!res.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await res.json()
      setTechnician(data.technician)

      // Exit edit mode
      if (field === 'name') setEditingName(false)
      if (field === 'address') setEditingAddress(false)
      if (field === 'specs') setEditingSpecs(false)
      if (field === 'hours') setEditingHours(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-navy to-blue-900 text-white p-6 pb-8">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 text-blue-200 hover:text-white transition-colors"
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
                    setName(technician?.name || '')
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
            <p className="text-gray-700 text-lg">{technician?.name}</p>
          )}
        </div>

        {/* Work Address */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary-navy">{t('workAddress')}</h2>
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
                value={workAddress}
                onChange={(e) => setWorkAddress(e.target.value)}
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
                    setWorkAddress(technician?.workAddress || '')
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
              {technician?.workAddress || <span className="text-gray-400 italic">Not set</span>}
            </p>
          )}
        </div>

        {/* Specializations */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary-navy">{t('specializations')}</h2>
            {!editingSpecs && (
              <button
                onClick={() => setEditingSpecs(true)}
                className="text-accent-orange font-medium text-sm"
              >
                {t('edit')}
              </button>
            )}
          </div>

          {editingSpecs ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
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
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave('specs')}
                  isLoading={saving}
                  className="flex-1"
                >
                  {t('save')}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedSpecs(technician?.specializations || [])
                    setEditingSpecs(false)
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {technician?.specializations.map((specId) => {
                const spec = SPECIALIZATIONS.find(s => s.id === specId)
                return spec ? (
                  <Chip
                    key={specId}
                    label={t(spec.key)}
                    icon={spec.icon}
                    selected={true}
                    onClick={() => {}}
                  />
                ) : (
                  <div key={specId} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {specId}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary-navy">{t('availability')}</h2>
            {!editingHours && (
              <button
                onClick={() => setEditingHours(true)}
                className="text-accent-orange font-medium text-sm"
              >
                {t('edit')}
              </button>
            )}
          </div>

          {editingHours ? (
            <div className="space-y-4">
              {DAYS.map(day => (
                <div key={day.id} className="border-b border-gray-100 pb-4">
                  <Toggle
                    enabled={workingHours[day.id]?.enabled || false}
                    onChange={() => toggleDay(day.id)}
                    label={t(day.key)}
                  />

                  {workingHours[day.id]?.enabled && (
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

              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave('hours')}
                  isLoading={saving}
                  className="flex-1"
                >
                  {t('save')}
                </Button>
                <Button
                  onClick={() => {
                    setWorkingHours(technician?.workingHours || {})
                    setEditingHours(false)
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {DAYS.map(day => {
                const dayData = technician?.workingHours[day.id]
                return (
                  <div key={day.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-700">{t(day.key)}</span>
                    {dayData?.enabled ? (
                      <span className="text-sm text-gray-600" dir="ltr">
                        {dayData.start} - {dayData.end}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Off</span>
                    )}
                  </div>
                )
              })}
            </div>
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
            onClick={() => router.push('/dashboard')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
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
          <button className="flex flex-col items-center gap-1 text-accent-orange">
            <span className="text-2xl">👤</span>
            <span className="text-xs font-medium">{t('profile')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
