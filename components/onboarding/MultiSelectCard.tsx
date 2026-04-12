'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Option {
  label: string
  value: string
  description?: string
  emoji?: string
}

interface MultiSelectCardProps {
  question: string
  subtitle?: string
  options: Option[]
  onSubmit: (values: string[]) => void
  currentStep: number
  totalSteps: number
  minSelections?: number
  maxSelections?: number
}

export function MultiSelectCard({
  question,
  subtitle,
  options,
  onSubmit,
  currentStep,
  totalSteps,
  minSelections = 2,
  maxSelections = 3,
}: MultiSelectCardProps) {
  const [selected, setSelected] = useState<string[]>([])

  const toggleSelection = (value: string) => {
    setSelected((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value)
      }
      if (prev.length >= maxSelections) {
        return prev
      }
      return [...prev, value]
    })
  }

  const canSubmit = selected.length >= minSelections && selected.length <= maxSelections

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
        {question}
      </h2>
      {subtitle && (
        <p className="text-green-400 text-center mb-2">{subtitle}</p>
      )}
      <p className="text-green-500 text-sm text-center mb-6">
        Select {minSelections}-{maxSelections} options ({selected.length} selected)
      </p>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {options.map((option, index) => {
          const isSelected = selected.includes(option.value)
          const isDisabled = !isSelected && selected.length >= maxSelections

          return (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => toggleSelection(option.value)}
              disabled={isDisabled}
              className={`p-4 text-center rounded-xl border transition-all duration-200
                ${isSelected
                  ? 'bg-green-600/20 border-green-500 ring-2 ring-green-500/50'
                  : 'bg-[#1a2e1a] border-green-800/30 hover:border-green-600/50'}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {option.emoji && (
                <span className="text-2xl block mb-2">{option.emoji}</span>
              )}
              <div className={`font-medium ${isSelected ? 'text-green-300' : 'text-green-50'}`}>
                {option.label}
              </div>
              {option.description && (
                <div className="text-green-400 text-xs mt-1">
                  {option.description}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Continue button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => onSubmit(selected)}
        disabled={!canSubmit}
        className={`w-full py-4 rounded-xl font-medium transition-all duration-200
          ${canSubmit
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-green-800/30 text-green-500 cursor-not-allowed'}
        `}
      >
        Continue
      </motion.button>
    </motion.div>
  )
}
