'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { GoalDuration } from '@/types/user'

interface GoalDurationCardProps {
  onSubmit: (duration: GoalDuration) => void
  currentStep: number
  totalSteps: number
}

const DURATION_OPTIONS: { value: GoalDuration; label: string; description: string }[] = [
  { value: 7, label: '7 days', description: 'Quick start - build initial momentum' },
  { value: 14, label: '14 days', description: 'Form new habits' },
  { value: 21, label: '21 days', description: 'Solidify your routine' },
  { value: 30, label: '30 days', description: 'Full commitment challenge' },
]

export function GoalDurationCard({
  onSubmit,
  currentStep,
  totalSteps,
}: GoalDurationCardProps) {
  const [selectedDuration, setSelectedDuration] = useState<GoalDuration>(14)

  const selectedOption = DURATION_OPTIONS.find((opt) => opt.value === selectedDuration)

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
        Set your initial goal
      </h2>
      <p className="text-green-400 text-center mb-8">
        How long do you want to commit to daily actions?
      </p>

      {/* Large number display */}
      <div className="text-center mb-8">
        <motion.div
          key={selectedDuration}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block"
        >
          <span className="text-7xl font-bold text-green-400">{selectedDuration}</span>
          <span className="text-3xl text-green-500 ml-2">days</span>
        </motion.div>
        <motion.p
          key={selectedOption?.description}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-green-300 mt-3"
        >
          {selectedOption?.description}
        </motion.p>
      </div>

      {/* Duration selector buttons */}
      <div className="flex justify-center gap-3 mb-8">
        {DURATION_OPTIONS.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedDuration(option.value)}
            className={`px-5 py-3 rounded-xl font-medium transition-all duration-200
              ${selectedDuration === option.value
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                : 'bg-[#1a2e1a] text-green-300 border border-green-800/30 hover:border-green-600/50'}
            `}
          >
            {option.label}
          </motion.button>
        ))}
      </div>

      {/* Visual progress preview */}
      <div className="bg-[#1a2e1a] rounded-xl p-4 mb-8 border border-green-800/30">
        <p className="text-green-400 text-sm mb-3">Your journey preview:</p>
        <div className="flex gap-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={`h-3 flex-1 rounded-sm transition-colors duration-200
                ${i < selectedDuration ? 'bg-green-600' : 'bg-green-900/30'}
              `}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-green-500">
          <span>Day 1</span>
          <span>Day 30</span>
        </div>
      </div>

      {/* Continue button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => onSubmit(selectedDuration)}
        className="w-full py-4 rounded-xl font-medium bg-green-600 hover:bg-green-500 text-white transition-all duration-200"
      >
        Commit to {selectedDuration} days
      </motion.button>
    </motion.div>
  )
}
