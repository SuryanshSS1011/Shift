'use client'

import { motion } from 'framer-motion'

interface Option {
  label: string
  value: string
  description?: string
  emoji?: string
}

interface QuestionCardProps {
  question: string
  subtitle?: string
  options: Option[]
  onSelect: (value: string) => void
  currentStep: number
  totalSteps: number
}

export function QuestionCard({
  question,
  subtitle,
  options,
  onSelect,
  currentStep,
  totalSteps,
}: QuestionCardProps) {
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
        <p className="text-green-400 text-center mb-6">{subtitle}</p>
      )}

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => onSelect(option.value)}
            className="w-full p-4 text-left rounded-xl bg-[#1a2e1a] hover:bg-[#243824]
                       border border-green-800/30 hover:border-green-600/50
                       transition-all duration-200 group flex items-center gap-4"
          >
            {option.emoji && (
              <span className="text-2xl flex-shrink-0">{option.emoji}</span>
            )}
            <div>
              <div className="text-green-50 font-medium group-hover:text-green-300 transition-colors">
                {option.label}
              </div>
              {option.description && (
                <div className="text-green-400 text-sm mt-0.5">
                  {option.description}
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
