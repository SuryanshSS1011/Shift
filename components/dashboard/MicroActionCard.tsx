'use client'

import { motion } from 'framer-motion'

interface MicroActionCardProps {
  action: {
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
  onComplete: () => void
  isCompleting: boolean
}

// Loading skeleton that matches the card's exact height
export function MicroActionCardSkeleton() {
  return (
    <div className="bg-[#1a2e1a] rounded-2xl overflow-hidden border border-green-800/30 animate-pulse">
      {/* Category Badge skeleton */}
      <div className="px-6 py-3 bg-green-800/20 flex items-center gap-2">
        <div className="w-6 h-6 bg-green-800/30 rounded" />
        <div className="w-16 h-4 bg-green-800/30 rounded" />
        <div className="ml-auto w-12 h-4 bg-green-800/30 rounded" />
      </div>

      {/* Content skeleton */}
      <div className="p-6">
        {/* Title */}
        <div className="h-6 bg-green-800/30 rounded w-3/4 mb-3" />

        {/* Anchor Habit */}
        <div className="bg-[#0f1a0f] rounded-xl p-4 mb-4">
          <div className="h-4 bg-green-800/30 rounded w-1/4 mb-2" />
          <div className="h-5 bg-green-800/30 rounded w-2/3" />
        </div>

        {/* Description */}
        <div className="space-y-2 mb-6">
          <div className="h-4 bg-green-800/30 rounded w-full" />
          <div className="h-4 bg-green-800/30 rounded w-5/6" />
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0f1a0f] rounded-xl p-4">
            <div className="h-8 bg-green-800/30 rounded w-1/2 mx-auto mb-2" />
            <div className="h-4 bg-green-800/30 rounded w-2/3 mx-auto" />
          </div>
          <div className="bg-[#0f1a0f] rounded-xl p-4">
            <div className="h-8 bg-green-800/30 rounded w-1/2 mx-auto mb-2" />
            <div className="h-4 bg-green-800/30 rounded w-2/3 mx-auto" />
          </div>
        </div>

        {/* Equivalency */}
        <div className="h-4 bg-green-800/30 rounded w-1/2 mx-auto mb-6" />

        {/* Button */}
        <div className="h-14 bg-green-800/30 rounded-xl" />
      </div>
    </div>
  )
}

const categoryConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  food: { label: 'F', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  transport: { label: 'T', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  energy: { label: 'E', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  shopping: { label: 'S', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  water: { label: 'W', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  waste: { label: 'R', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
}

export function MicroActionCard({ action, onComplete, isCompleting }: MicroActionCardProps) {
  const config = categoryConfig[action.category] || categoryConfig.food

  if (action.completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a2e1a] rounded-2xl p-6 border border-green-600/30"
      >
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-4"
          >
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h3 className="text-xl font-semibold text-green-50 mb-2">
            Action Completed!
          </h3>
          <p className="text-green-400">
            You saved {action.co2SavingsKg} kg CO₂ today
          </p>
          <p className="text-green-300 text-sm mt-1">
            {action.equivalencyLabel}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a2e1a] rounded-2xl overflow-hidden border border-green-800/30"
    >
      {/* Category Badge */}
      <div className={`px-6 py-3 ${config.bgColor} flex items-center gap-2`}>
        <span className={`text-xl font-bold ${config.color}`}>{config.label}</span>
        <span className={`text-sm font-medium ${config.color} capitalize`}>
          {action.category}
        </span>
        <span className="ml-auto text-green-400 text-sm">
          {action.timeRequiredMinutes === 0 ? 'Quick win' : `${action.timeRequiredMinutes} min`}
        </span>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-green-50 mb-3">
          {action.title}
        </h3>

        {/* Anchor Habit */}
        <div className="bg-[#0f1a0f] rounded-xl p-4 mb-4">
          <p className="text-green-300 text-sm mb-1">Your trigger:</p>
          <p className="text-green-50">{action.anchorHabit}</p>
        </div>

        <p className="text-green-300 mb-6">
          {action.description}
        </p>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0f1a0f] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-50">
              {action.co2SavingsKg} kg
            </div>
            <div className="text-green-400 text-sm">CO₂ saved</div>
          </div>
          <div className="bg-[#0f1a0f] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-50">
              ${action.dollarSavings.toFixed(2)}
            </div>
            <div className="text-green-400 text-sm">saved</div>
          </div>
        </div>

        {/* Equivalency */}
        <p className="text-center text-green-400 text-sm mb-6">
          {action.equivalencyLabel}
        </p>

        {/* Complete Button */}
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-green-800
                     text-white font-semibold rounded-xl transition-colors text-lg
                     flex items-center justify-center gap-2"
        >
          {isCompleting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              I Did It!
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}
