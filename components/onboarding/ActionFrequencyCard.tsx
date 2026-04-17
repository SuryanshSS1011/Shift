'use client'

import { motion } from 'framer-motion'
import type { ActionFrequency } from '@/types/user'

interface ActionFrequencyCardProps {
  onSubmit: (frequency: ActionFrequency) => void
  currentStep: number
  totalSteps: number
}

const FREQUENCY_OPTIONS: {
  value: ActionFrequency
  label: string
  emoji: string
  description: string
}[] = [
  {
    value: 'hourly',
    label: 'Every hour',
    emoji: '⚡',
    description: 'Maximum engagement, ~16 actions/day',
  },
  {
    value: 'multiple_daily',
    label: 'Multiple times daily',
    emoji: '🌟',
    description: 'High frequency, 3-4 actions/day',
  },
  {
    value: 'daily',
    label: 'Once daily',
    emoji: '☀️',
    description: 'Balanced pace, 1 action/day',
  },
  {
    value: 'every_other_day',
    label: 'Every other day',
    emoji: '🌙',
    description: 'Relaxed pace, ~3-4 actions/week',
  },
  {
    value: 'twice_weekly',
    label: 'Twice weekly',
    emoji: '📅',
    description: 'Light engagement, 2 actions/week',
  },
]

export function ActionFrequencyCard({
  onSubmit,
  currentStep,
  totalSteps,
}: ActionFrequencyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-lg mx-auto px-4"
    >
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-green-400 mb-2">
          <span>Question {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 bg-[#1a2e1a] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-600 rounded-full"
            initial={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-2xl font-semibold text-green-50 mb-2 text-center">
        How often do you want actions?
      </h2>
      <p className="text-green-400 text-center mb-8">
        Set your preferred frequency for micro-actions
      </p>

      {/* Option buttons */}
      <div className="space-y-3">
        {FREQUENCY_OPTIONS.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSubmit(option.value)}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#1a2e1a] border border-green-800/30
              hover:border-green-600/50 hover:bg-[#1f3a1f] transition-all duration-200 group text-left"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-[#0f1a0f] rounded-lg
              group-hover:bg-green-900/30 transition-colors text-2xl">
              {option.emoji}
            </div>
            <div className="flex-1">
              <div className="font-medium text-green-50 group-hover:text-green-400 transition-colors">
                {option.label}
              </div>
              <div className="text-sm text-green-500">
                {option.description}
              </div>
            </div>
            <div className="text-green-600 group-hover:text-green-400 transition-colors">
              →
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
