'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/shared/Header'
import { SettingsSkeleton } from '@/components/dashboard/Skeletons'

interface UserSettings {
  notifications: {
    dailyReminder: boolean
    weeklyReport: boolean
    pushEnabled: boolean
  }
  preferences: {
    difficultyLevel: 'easy' | 'medium' | 'challenge' | 'auto'
    focusCategories: string[]
  }
  profile: {
    city: string
    commuteType: string
    dietPattern: string
  }
}

const categoryOptions = [
  { id: 'food', label: 'Food & Diet', icon: '🍽️' },
  { id: 'transport', label: 'Transportation', icon: '🚗' },
  { id: 'energy', label: 'Home Energy', icon: '⚡' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'water', label: 'Water Usage', icon: '💧' },
  { id: 'waste', label: 'Waste & Recycling', icon: '♻️' },
]

const difficultyOptions = [
  { value: 'auto', label: 'Auto (based on streak)', description: 'Difficulty increases with your streak' },
  { value: 'easy', label: 'Easy', description: 'Quick, simple actions' },
  { value: 'medium', label: 'Medium', description: 'Moderate effort required' },
  { value: 'challenge', label: 'Challenge', description: 'Push yourself further' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      dailyReminder: true,
      weeklyReport: true,
      pushEnabled: false,
    },
    preferences: {
      difficultyLevel: 'auto',
      focusCategories: [],
    },
    profile: {
      city: '',
      commuteType: '',
      dietPattern: '',
    },
  })

  useEffect(() => {
    const sessionId = localStorage.getItem('shift_session_id')
    if (!sessionId) {
      router.push('/onboarding')
      return
    }

    // Load settings from localStorage (could also fetch from API)
    const savedSettings = localStorage.getItem('shift_settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Error parsing settings:', e)
      }
    }

    // Fetch profile data
    fetch('/api/get-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSettings((prev) => ({
            ...prev,
            profile: {
              city: data.data.profile.city || '',
              commuteType: data.data.profile.commuteType || '',
              dietPattern: data.data.profile.dietPattern || '',
            },
            preferences: {
              ...prev.preferences,
              focusCategories: data.data.profile.topImpactAreas || [],
            },
          }))
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [router])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem('shift_settings', JSON.stringify(settings))

      // Could also save to API here
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setIsSaving(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        focusCategories: prev.preferences.focusCategories.includes(categoryId)
          ? prev.preferences.focusCategories.filter((c) => c !== categoryId)
          : [...prev.preferences.focusCategories, categoryId],
      },
    }))
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, pushEnabled: true },
      }))
    }
  }

  const handleExportData = async () => {
    const sessionId = localStorage.getItem('shift_session_id')
    if (!sessionId) return

    try {
      const response = await fetch('/api/export-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `shift-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
      return
    }

    if (!confirm('This will permanently delete your profile, actions, and all progress. Continue?')) {
      return
    }

    localStorage.removeItem('shift_session_id')
    localStorage.removeItem('shift_settings')
    router.push('/onboarding')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1a0f]">
        <Header />
        <main className="px-4 py-6 max-w-lg mx-auto">
          <SettingsSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1a0f]">
      <Header />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-green-50"
        >
          Settings
        </motion.h1>

        {/* Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30"
        >
          <h2 className="text-lg font-semibold text-green-50 mb-4">Notifications</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-50">Daily Reminder</p>
                <p className="text-green-400 text-sm">Get reminded to complete your action</p>
              </div>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      dailyReminder: !prev.notifications.dailyReminder,
                    },
                  }))
                }
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.dailyReminder ? 'bg-green-600' : 'bg-green-800/50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.notifications.dailyReminder ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-50">Weekly Report</p>
                <p className="text-green-400 text-sm">Receive your weekly impact summary</p>
              </div>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      weeklyReport: !prev.notifications.weeklyReport,
                    },
                  }))
                }
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.weeklyReport ? 'bg-green-600' : 'bg-green-800/50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.notifications.weeklyReport ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-50">Push Notifications</p>
                <p className="text-green-400 text-sm">Enable browser notifications</p>
              </div>
              {settings.notifications.pushEnabled ? (
                <span className="text-green-400 text-sm">Enabled</span>
              ) : (
                <button
                  onClick={requestNotificationPermission}
                  className="px-3 py-1 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </motion.section>

        {/* Action Preferences */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30"
        >
          <h2 className="text-lg font-semibold text-green-50 mb-4">Action Preferences</h2>

          <div className="space-y-4">
            <div>
              <p className="text-green-50 mb-2">Difficulty Level</p>
              <div className="grid grid-cols-2 gap-2">
                {difficultyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        preferences: { ...prev.preferences, difficultyLevel: option.value as 'easy' | 'medium' | 'challenge' | 'auto' },
                      }))
                    }
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      settings.preferences.difficultyLevel === option.value
                        ? 'border-green-500 bg-green-600/20'
                        : 'border-green-800/30 hover:border-green-600/50'
                    }`}
                  >
                    <p className="text-green-50 font-medium text-sm">{option.label}</p>
                    <p className="text-green-400 text-xs mt-0.5">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-green-50 mb-2">Focus Categories</p>
              <p className="text-green-400 text-sm mb-3">Select categories you want to prioritize</p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`px-3 py-2 rounded-full border text-sm transition-colors flex items-center gap-1.5 ${
                      settings.preferences.focusCategories.includes(category.id)
                        ? 'border-green-500 bg-green-600/20 text-green-50'
                        : 'border-green-800/30 text-green-400 hover:border-green-600/50'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Profile Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30"
        >
          <h2 className="text-lg font-semibold text-green-50 mb-4">Profile</h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-green-400">City</span>
              <span className="text-green-50">{settings.profile.city || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400">Commute Type</span>
              <span className="text-green-50 capitalize">
                {settings.profile.commuteType?.replace('_', ' ') || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400">Diet Pattern</span>
              <span className="text-green-50 capitalize">
                {settings.profile.dietPattern?.replace('_', ' ') || 'Not set'}
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push('/onboarding?retake=true')}
            className="mt-4 w-full py-2 border border-green-600 text-green-400 hover:bg-green-600/10 rounded-xl transition-colors text-sm"
          >
            Update Profile (Retake Quiz)
          </button>
        </motion.section>

        {/* Data Management */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30"
        >
          <h2 className="text-lg font-semibold text-green-50 mb-4">Data Management</h2>

          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full py-3 border border-green-600 text-green-400 hover:bg-green-600/10 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export My Data
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full py-3 border border-red-600/50 text-red-400 hover:bg-red-600/10 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete All Data
            </button>
          </div>
        </motion.section>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </motion.div>
      </main>
    </div>
  )
}
