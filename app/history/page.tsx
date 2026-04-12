'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/shared/Header'
import { ActionHistorySkeleton } from '@/components/dashboard/Skeletons'
import { formatCO2 } from '@/lib/emissions/calculator'

interface HistoryAction {
  id: string
  actionDate: string
  category: string
  title: string
  description: string
  co2SavingsKg: number
  dollarSavings: number
  completed: boolean
  completedAt: string | null
}

const categoryColors: Record<string, string> = {
  food: 'bg-amber-500',
  transport: 'bg-blue-600',
  energy: 'bg-yellow-500',
  shopping: 'bg-purple-600',
  water: 'bg-cyan-500',
  waste: 'bg-orange-500',
}

const categoryIcons: Record<string, string> = {
  food: '🍽️',
  transport: '🚗',
  energy: '⚡',
  shopping: '🛍️',
  water: '💧',
  waste: '♻️',
}

export default function HistoryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [actions, setActions] = useState<HistoryAction[]>([])
  const [filter, setFilter] = useState<'all' | 'completed' | string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const sessionId = localStorage.getItem('shift_session_id')
    if (!sessionId) {
      router.push('/onboarding')
      return
    }

    fetchActions(sessionId)
  }, [router])

  const fetchActions = async (sessionId: string) => {
    try {
      const response = await fetch('/api/action-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()
      if (data.success) {
        setActions(data.data.actions)
      }
    } catch (error) {
      console.error('Error fetching actions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredActions = actions.filter((action) => {
    // Apply category/completion filter
    if (filter === 'completed' && !action.completed) return false
    if (filter !== 'all' && filter !== 'completed' && action.category !== filter) return false

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        action.title.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query)
      )
    }

    return true
  })

  const groupedActions = filteredActions.reduce(
    (groups, action) => {
      const date = action.actionDate
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(action)
      return groups
    },
    {} as Record<string, HistoryAction[]>
  )

  const sortedDates = Object.keys(groupedActions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today'
    }
    if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday'
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }

  // Calculate totals
  const totals = filteredActions.reduce(
    (acc, action) => {
      if (action.completed) {
        acc.co2 += action.co2SavingsKg
        acc.dollars += action.dollarSavings
        acc.count += 1
      }
      return acc
    },
    { co2: 0, dollars: 0, count: 0 }
  )

  return (
    <div className="min-h-screen bg-[#0f1a0f]">
      <Header />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-2xl font-bold text-green-50">Action History</h1>
          <span className="text-green-400 text-sm">{filteredActions.length} actions</span>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1a2e1a] border border-green-800/30
                       text-green-50 placeholder-green-600
                       focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-[#1a2e1a] text-green-400 border border-green-800/30'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-[#1a2e1a] text-green-400 border border-green-800/30'
            }`}
          >
            Completed
          </button>
          {Object.entries(categoryIcons).map(([category, icon]) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filter === category
                  ? 'bg-green-600 text-white'
                  : 'bg-[#1a2e1a] text-green-400 border border-green-800/30'
              }`}
            >
              <span>{icon}</span>
              <span className="capitalize">{category}</span>
            </button>
          ))}
        </motion.div>

        {/* Summary Stats */}
        {totals.count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#1a2e1a] rounded-2xl p-4 border border-green-800/30"
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-50">{totals.count}</div>
                <div className="text-green-400 text-xs">Completed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-50">{formatCO2(totals.co2)}</div>
                <div className="text-green-400 text-xs">CO₂ Saved</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-50">${totals.dollars.toFixed(0)}</div>
                <div className="text-green-400 text-xs">Saved</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action List */}
        {isLoading ? (
          <ActionHistorySkeleton />
        ) : sortedDates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-50 mb-2">No actions yet</h3>
            <p className="text-green-400">Complete your first action to see it here!</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {sortedDates.map((date, dateIndex) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + dateIndex * 0.05 }}
                >
                  <h3 className="text-sm font-medium text-green-400 mb-3">{formatDate(date)}</h3>
                  <div className="space-y-3">
                    {groupedActions[date].map((action) => (
                      <div
                        key={action.id}
                        className="bg-[#1a2e1a] rounded-xl p-4 border border-green-800/30"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              categoryColors[action.category] || 'bg-green-600'
                            }`}
                          >
                            <span className="text-lg">
                              {categoryIcons[action.category] || '🌱'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-green-50 font-medium leading-tight">
                                {action.title}
                              </h4>
                              {action.completed && (
                                <div className="flex-shrink-0 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className="text-green-400 text-sm mt-1 line-clamp-2">
                              {action.description}
                            </p>
                            <div className="flex gap-3 mt-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-green-600/20 text-green-300">
                                {formatCO2(action.co2SavingsKg)} CO₂
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-green-600/20 text-green-300">
                                ${action.dollarSavings.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
