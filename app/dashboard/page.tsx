'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MicroActionCard } from '@/components/dashboard/MicroActionCard'
import { StreakDisplay } from '@/components/dashboard/StreakDisplay'
import { ImpactDashboard } from '@/components/dashboard/ImpactDashboard'
import { CelebrationOverlay } from '@/components/dashboard/CelebrationOverlay'

interface Action {
  id: string
  category: string
  title: string
  description: string
  anchorHabit: string
  co2SavingsKg: number
  dollarSavings: number
  timeRequiredMinutes: number
  difficultyLevel: string
  equivalencyLabel: string
  completed: boolean
}

interface DashboardData {
  action: Action | null
  streak: { current: number; longest: number }
  totals: {
    totalCo2SavedKg: number
    totalDollarSaved: number
    totalActionsCompleted: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [data, setData] = useState<DashboardData>({
    action: null,
    streak: { current: 0, longest: 0 },
    totals: { totalCo2SavedKg: 0, totalDollarSaved: 0, totalActionsCompleted: 0 },
  })

  // Get session ID
  useEffect(() => {
    const storedSessionId = localStorage.getItem('shift_session_id')
    if (!storedSessionId) {
      router.push('/onboarding')
      return
    }
    setSessionId(storedSessionId)
  }, [router])

  // Fetch today's action
  const fetchAction = useCallback(async () => {
    if (!sessionId) return

    try {
      const response = await fetch('/api/generate-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const result = await response.json()

      if (response.status === 404) {
        // User not found - redirect to onboarding
        localStorage.removeItem('shift_session_id')
        router.push('/onboarding')
        return
      }

      if (result.success) {
        setData((prev) => ({
          ...prev,
          action: result.data,
        }))
      }
    } catch (error) {
      console.error('Error fetching action:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, router])

  useEffect(() => {
    if (sessionId) {
      fetchAction()
    }
  }, [sessionId, fetchAction])

  // Complete action
  const handleComplete = async () => {
    if (!data.action || isCompleting) return

    setIsCompleting(true)

    try {
      const response = await fetch('/api/complete-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          actionId: data.action.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setData((prev) => ({
          action: prev.action ? { ...prev.action, completed: true } : null,
          streak: result.data.streak,
          totals: result.data.totals,
        }))
        setShowCelebration(true)
      }
    } catch (error) {
      console.error('Error completing action:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const closeCelebration = useCallback(() => {
    setShowCelebration(false)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-green-400">Loading your action...</p>
        </div>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#0f1a0f]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-6 border-b border-green-800/30"
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-green-50">Shift</span>
            </div>
            <div className="text-green-400 text-sm">{today}</div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Today's Action */}
        <section>
          <h2 className="text-green-300 text-sm font-medium mb-3">
            Today&apos;s Action
          </h2>
          {data.action ? (
            <MicroActionCard
              action={data.action}
              onComplete={handleComplete}
              isCompleting={isCompleting}
            />
          ) : (
            <div className="bg-[#1a2e1a] rounded-2xl p-6 border border-green-800/30 text-center">
              <p className="text-green-400">
                Unable to load action. Please refresh.
              </p>
            </div>
          )}
        </section>

        {/* Streak */}
        <section>
          <h2 className="text-green-300 text-sm font-medium mb-3">
            Your Streak
          </h2>
          <StreakDisplay
            currentStreak={data.streak.current}
            longestStreak={data.streak.longest}
          />
        </section>

        {/* Impact */}
        <section>
          <ImpactDashboard
            totalCo2SavedKg={data.totals.totalCo2SavedKg}
            totalDollarSaved={data.totals.totalDollarSaved}
            totalActionsCompleted={data.totals.totalActionsCompleted}
          />
        </section>
      </main>

      {/* Celebration Overlay */}
      <CelebrationOverlay
        isVisible={showCelebration}
        onClose={closeCelebration}
        co2Saved={data.action?.co2SavingsKg || 0}
        streak={data.streak.current}
      />
    </div>
  )
}
