'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Share2 } from 'lucide-react'
import { Header } from '@/components/shared/Header'
import { MicroActionCard, MicroActionCardSkeleton } from '@/components/dashboard/MicroActionCard'
import { StreakDisplay } from '@/components/dashboard/StreakDisplay'
import { ImpactDashboard } from '@/components/dashboard/ImpactDashboard'
import { GridIntensityWidget } from '@/components/dashboard/GridIntensityWidget'
import { GridForecastWidget } from '@/components/dashboard/GridForecastWidget'
import { CelebrationOverlay } from '@/components/dashboard/CelebrationOverlay'
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap'
import { WeeklyReport } from '@/components/dashboard/WeeklyReport'
import { CategoryStreaks } from '@/components/dashboard/CategoryStreaks'
import { ImpactProjection } from '@/components/dashboard/ImpactProjection'
import { useDemoMode } from '@/lib/hooks/useDemoMode'
import type { GridForecastResponse } from '@/types/grid'
import type { CategoryStreak } from '@/types/impact'
import type { MicroAction } from '@/types/action'
import type { LevelName } from '@/lib/points'

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
  sdgTags?: number[]
  points?: number
  aiCostCo2Grams?: number
  completed: boolean
}

interface GridData {
  zone: string
  carbonIntensity: number
  renewablePercent: number
}

interface WeeklyReportData {
  whatWentWell: string
  patternObserved: string
  focusThisWeek: string
}

interface DashboardData {
  action: Action | null
  streak: { current: number; longest: number }
  categoryStreaks: CategoryStreak[]
  totals: {
    totalCo2SavedKg: number
    totalDollarSaved: number
    totalActionsCompleted: number
    totalPoints: number
    level: LevelName
    levelEmoji: string
  }
  grid: GridData | null
  gridForecast: GridForecastResponse | null
  completedDates: string[]
  weeklyReport: WeeklyReportData | null
  recentActions: MicroAction[]
  goalDuration: number
  goalStartDate: string
}

function DashboardContent() {
  const router = useRouter()
  const demoMode = useDemoMode()
  const [sessionId, setSessionId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData>({
    action: null,
    streak: { current: 0, longest: 0 },
    categoryStreaks: [],
    totals: {
      totalCo2SavedKg: 0,
      totalDollarSaved: 0,
      totalActionsCompleted: 0,
      totalPoints: 0,
      level: 'Seedling',
      levelEmoji: '🌱',
    },
    grid: null,
    gridForecast: null,
    completedDates: [],
    weeklyReport: null,
    recentActions: [],
    goalDuration: 14,
    goalStartDate: new Date().toISOString().split('T')[0],
  })

  // Get session ID (demo mode uses hardcoded)
  useEffect(() => {
    if (demoMode.isDemoMode) {
      setSessionId(demoMode.sessionId)
      // Generate demo completed dates (last 12 days for demo streak)
      const demoDates: string[] = []
      const today = new Date()
      for (let i = 0; i < 12; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        demoDates.push(date.toISOString().split('T')[0])
      }
      // Add deterministic older dates for heatmap variety
      const olderDateOffsets = [15, 17, 19, 21, 24]
      for (const offset of olderDateOffsets) {
        const date = new Date(today)
        date.setDate(date.getDate() - offset)
        demoDates.push(date.toISOString().split('T')[0])
      }
      // Demo category streaks
      const demoCategoryStreaks: CategoryStreak[] = [
        { category: 'food', currentStreak: 4, longestStreak: 4, lastActionDate: new Date().toISOString().split('T')[0] },
        { category: 'energy', currentStreak: 7, longestStreak: 7, lastActionDate: new Date().toISOString().split('T')[0] },
        { category: 'transport', currentStreak: 2, longestStreak: 5, lastActionDate: new Date().toISOString().split('T')[0] },
      ]

      // Demo recent actions for projection
      const demoRecentActions: MicroAction[] = Array.from({ length: 7 }, (_, i) => ({
        id: `demo-${i}`,
        userId: 'demo',
        actionDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: ['food', 'transport', 'energy'][i % 3] as MicroAction['category'],
        title: 'Demo action',
        description: 'Demo description',
        anchorHabit: 'After morning',
        co2SavingsKg: 1.2 + (i * 0.3),
        dollarSavings: 2.0 + (i * 0.5),
        timeRequiredMinutes: 5,
        difficultyLevel: 'easy',
        behavioralFrame: 'values',
        equivalencyLabel: '= 3 miles',
        sdgTags: [13, 12],
        points: 15 + i * 2,
        aiCostCo2Grams: 0.08,
        completed: true,
        completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      }))

      setData((prev) => ({
        ...prev,
        action: { ...demoMode.action, sdgTags: [13, 2, 12], points: 17, aiCostCo2Grams: 0.08 },
        streak: demoMode.streak,
        categoryStreaks: demoCategoryStreaks,
        totals: {
          ...demoMode.totals,
          totalPoints: 847,
          level: 'Sprout',
          levelEmoji: '🌿',
        },
        grid: demoMode.grid,
        gridForecast: demoMode.gridForecast,
        completedDates: demoDates,
        weeklyReport: {
          whatWentWell: "You've been incredibly consistent with your food choices this week. Swapping beef for plant-based alternatives 4 times saved significant CO₂ and money.",
          patternObserved: "Your actions tend to be strongest in the morning, particularly around breakfast and commute decisions. Evening energy habits could use more attention.",
          focusThisWeek: "Try unplugging devices before bed — it's a quick win that compounds over time. Your transit choices have been excellent, keep that momentum going.",
        },
        recentActions: demoRecentActions,
        goalDuration: 14,
        goalStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }))
      setIsLoading(false)
      return
    }

    const storedSessionId = localStorage.getItem('shift_session_id')
    if (!storedSessionId) {
      router.push('/onboarding')
      return
    }
    setSessionId(storedSessionId)
  }, [router, demoMode])

  // Fetch today's action
  const fetchAction = useCallback(async () => {
    if (!sessionId || demoMode.isDemoMode) return

    setError(null)

    try {
      const response = await fetch('/api/generate-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const result = await response.json()

      if (response.status === 404) {
        // User not found - redirect to onboarding
        if (!demoMode.isDemoMode) {
          localStorage.removeItem('shift_session_id')
          router.push('/onboarding')
        }
        return
      }

      if (result.success) {
        setData((prev) => ({
          ...prev,
          action: result.data,
        }))
      } else {
        setError('Unable to generate action. Please try again.')
      }
    } catch (err) {
      console.error('Error fetching action:', err)
      setError('Unable to load action. Please refresh.')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, router, demoMode.isDemoMode])

  // Fetch grid intensity
  const fetchGrid = useCallback(async () => {
    if (!sessionId || demoMode.isDemoMode) return

    try {
      const response = await fetch('/api/grid-intensity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const result = await response.json()

      if (result.success) {
        setData((prev) => ({
          ...prev,
          grid: result.data,
        }))
      }
    } catch (err) {
      console.error('Error fetching grid:', err)
    }
  }, [sessionId, demoMode.isDemoMode])

  // Fetch grid forecast
  const fetchGridForecast = useCallback(async () => {
    if (!sessionId || demoMode.isDemoMode) return

    try {
      const response = await fetch('/api/grid-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const result = await response.json()

      if (result.success) {
        setData((prev) => ({
          ...prev,
          gridForecast: result.data,
        }))
      }
    } catch (err) {
      console.error('Error fetching grid forecast:', err)
    }
  }, [sessionId, demoMode.isDemoMode])

  useEffect(() => {
    if (sessionId) {
      fetchAction()
      fetchGrid()
      fetchGridForecast()
    }
  }, [sessionId, fetchAction, fetchGrid, fetchGridForecast])

  // Complete action
  const handleComplete = async () => {
    if (!data.action || isCompleting) return

    setIsCompleting(true)

    // In demo mode, skip the API call and update state locally
    if (demoMode.isDemoMode) {
      setData((prev) => ({
        ...prev,
        action: prev.action ? { ...prev.action, completed: true } : null,
        // Keep demo totals unchanged - don't increment
      }))
      setShowCelebration(true)
      setIsCompleting(false)
      return
    }

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
          ...prev,
          action: prev.action ? { ...prev.action, completed: true } : null,
          streak: result.data.streak,
          categoryStreaks: result.data.categoryStreaks || prev.categoryStreaks,
          totals: {
            totalCo2SavedKg: result.data.totals.totalCo2SavedKg,
            totalDollarSaved: result.data.totals.totalDollarSaved,
            totalActionsCompleted: result.data.totals.totalActionsCompleted,
            totalPoints: result.data.totals.totalPoints || 0,
            level: result.data.totals.level || 'Seedling',
            levelEmoji: result.data.totals.levelEmoji || '🌱',
          },
        }))
        setShowCelebration(true)
      }
    } catch (err) {
      console.error('Error completing action:', err)
    } finally {
      setIsCompleting(false)
    }
  }

  const closeCelebration = useCallback(() => {
    setShowCelebration(false)
  }, [])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  // Handle share button click
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${sessionId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1a0f]">
      {/* Header with Menu */}
      <Header showMenu isDemoMode={demoMode.isDemoMode} />

      {/* Date display + Share button */}
      <div className="px-4 py-3 max-w-3xl mx-auto flex justify-between items-center">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-sm"
        >
          <Share2 className="w-4 h-4" />
          Share Impact
        </button>
        <div className="text-green-400 text-sm">{today}</div>
      </div>

      {/* Main content */}
      <main className="px-4 py-6 max-w-3xl mx-auto space-y-6">
        {/* Today's Action */}
        <section>
          <h2 className="text-green-300 text-sm font-medium mb-3">
            Today&apos;s Action
          </h2>
          {isLoading ? (
            <MicroActionCardSkeleton />
          ) : error ? (
            <div className="bg-[#1a2e1a] rounded-2xl p-6 border border-red-800/30">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setIsLoading(true)
                    fetchAction()
                  }}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : data.action ? (
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

        {/* Activities Panel - Streak + Heatmap */}
        <section>
          <h2 className="text-lg font-semibold text-green-50 mb-3">
            Your Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
            <StreakDisplay
              currentStreak={data.streak.current}
              longestStreak={data.streak.longest}
            />
            <ActivityHeatmap completedDates={data.completedDates} />
          </div>
        </section>

        {/* Category Streaks */}
        {data.categoryStreaks.length > 0 && (
          <section>
            <CategoryStreaks streaks={data.categoryStreaks} />
          </section>
        )}

        {/* Impact - Full width */}
        <section>
          <ImpactDashboard
            totalCo2SavedKg={data.totals.totalCo2SavedKg}
            totalDollarSaved={data.totals.totalDollarSaved}
            totalActionsCompleted={data.totals.totalActionsCompleted}
            totalPoints={data.totals.totalPoints}
            level={data.totals.level}
            levelEmoji={data.totals.levelEmoji}
          />
        </section>

        {/* Impact Projection */}
        <section>
          <ImpactProjection
            recentActions={data.recentActions}
            goalDuration={data.goalDuration}
            goalStartDate={data.goalStartDate}
          />
        </section>

        {/* Your Local Grid Insights - Full width */}
        {data.grid && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-green-50">
              Your Local Grid Insights
            </h2>
            <div className="space-y-3">
              <GridIntensityWidget
                zone={data.grid.zone}
                carbonIntensity={data.grid.carbonIntensity}
                renewablePercent={data.grid.renewablePercent}
              />
              <GridForecastWidget
                forecast={data.gridForecast}
                isLoading={!data.gridForecast && !demoMode.isDemoMode}
              />
            </div>
          </section>
        )}

        {/* Weekly Report - Full width */}
        <section>
          <WeeklyReport
            report={data.weeklyReport}
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

// Wrap in Suspense for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f1a0f] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-green-400">Loading...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
