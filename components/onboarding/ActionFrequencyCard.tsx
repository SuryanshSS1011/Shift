'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface ActionFrequencyCardProps {
  onSubmit: (hours: number) => void
  currentStep: number
  totalSteps: number
}

function getFrequencyDescription(hours: number): string {
  if (hours === 1) return 'Maximum engagement - an action every hour'
  if (hours <= 3) return 'High frequency - stay constantly engaged'
  if (hours <= 6) return 'Multiple actions throughout the day'
  if (hours <= 12) return 'Twice daily - morning and evening'
  if (hours < 24) return 'Balanced pace with room to breathe'
  return 'Once a day - steady and sustainable'
}

function getActionsPerDay(hours: number): string {
  const actions = Math.floor(24 / hours)
  if (actions === 1) return '1 action/day'
  return `~${actions} actions/day`
}

export function ActionFrequencyCard({
  onSubmit,
  currentStep,
  totalSteps,
}: ActionFrequencyCardProps) {
  const [selectedHours, setSelectedHours] = useState<number>(12)

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

      {/* Large number display */}
      <div className="text-center mb-6">
        <motion.div
          key={selectedHours}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block"
        >
          <span className="text-7xl font-bold text-green-400">{selectedHours}</span>
          <span className="text-3xl text-green-500 ml-2">{selectedHours === 1 ? 'hour' : 'hours'}</span>
        </motion.div>
        <motion.p
          key={getFrequencyDescription(selectedHours)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-green-300 mt-3"
        >
          {getFrequencyDescription(selectedHours)}
        </motion.p>
        <p className="text-green-500 text-sm mt-1">
          {getActionsPerDay(selectedHours)}
        </p>
      </div>

      {/* Slider */}
      <div className="mb-8 px-2">
        <input
          type="range"
          min="1"
          max="24"
          value={selectedHours}
          onChange={(e) => setSelectedHours(parseInt(e.target.value))}
          className="w-full h-3 bg-[#1a2e1a] rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-green-500
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-green-500/30
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-all
            [&::-webkit-slider-thumb]:hover:bg-green-400
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-green-500
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />
        <div className="flex justify-between mt-2 text-xs text-green-500">
          <span>1 hour</span>
          <span>12 hours</span>
          <span>24 hours</span>
        </div>
      </div>

      {/* Quick select buttons */}
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {[1, 4, 8, 12, 24].map((hours) => (
          <motion.button
            key={hours}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedHours(hours)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
              ${selectedHours === hours
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                : 'bg-[#1a2e1a] text-green-300 border border-green-800/30 hover:border-green-600/50'}
            `}
          >
            {hours}h
          </motion.button>
        ))}
      </div>

      {/* Continue button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => onSubmit(selectedHours)}
        className="w-full py-4 rounded-xl font-medium bg-green-600 hover:bg-green-500 text-white transition-all duration-200"
      >
        Every {selectedHours} {selectedHours === 1 ? 'hour' : 'hours'}
      </motion.button>
    </motion.div>
  )
}
