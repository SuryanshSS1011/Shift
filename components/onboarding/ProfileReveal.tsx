'use client'

import { motion } from 'framer-motion'
import { formatCO2 } from '@/lib/emissions/calculator'
import type { ActionFrequency } from '@/types/user'

interface ProfileRevealProps {
  profile: {
    topImpactAreas: string[]
    estimatedAnnualFootprintKg: number
    aiProfileSummary: string
    actionFrequency?: ActionFrequency
  }
}

const FREQUENCY_LABELS: Record<ActionFrequency, string> = {
  hourly: 'A personalized micro-action every hour',
  multiple_daily: '3-4 personalized micro-actions per day',
  daily: 'One personalized micro-action per day',
  every_other_day: 'A personalized micro-action every other day',
  twice_weekly: 'Two personalized micro-actions per week',
}

function getFrequencyLabel(frequency: ActionFrequency): string {
  return FREQUENCY_LABELS[frequency] || 'One personalized micro-action per day'
}

const categoryLabels: Record<string, { label: string; abbr: string; color: string }> = {
  food: { label: 'Food & Diet', abbr: 'F', color: 'bg-amber-500' },
  transport: { label: 'Transportation', abbr: 'T', color: 'bg-blue-600' },
  energy: { label: 'Home Energy', abbr: 'E', color: 'bg-yellow-500' },
  shopping: { label: 'Shopping', abbr: 'S', color: 'bg-purple-600' },
  water: { label: 'Water Usage', abbr: 'W', color: 'bg-cyan-500' },
  waste: { label: 'Waste & Recycling', abbr: 'R', color: 'bg-orange-500' },
}

export function ProfileReveal({ profile }: ProfileRevealProps) {
  const handleStart = () => {
    // Verify sessionId exists in localStorage before navigating
    const sessionId = localStorage.getItem('shift_session_id')
    if (sessionId) {
      // Use window.location for full page load to ensure clean state
      window.location.href = '/dashboard'
    } else {
      // Session should always exist at this point since onboarding sets it before showing ProfileReveal
      console.error('[ProfileReveal] Session ID not found in localStorage')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto px-4"
    >
      {/* Header with animated checkmark */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.3 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-4"
        >
          <svg
            className="w-10 h-10 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
        <h2 className="text-2xl font-bold text-green-50 mb-2">
          Your Sustainability Profile
        </h2>
        <p className="text-green-300">
          Here&apos;s what we learned about your impact
        </p>
      </motion.div>

      {/* AI Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#1a2e1a] rounded-xl p-6 mb-6 border border-green-800/30"
      >
        <p className="text-green-50 text-lg leading-relaxed">
          &quot;{profile.aiProfileSummary}&quot;
        </p>
      </motion.div>

      {/* Annual Footprint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#1a2e1a] rounded-xl p-6 mb-6 border border-green-800/30 text-center"
      >
        <div className="text-green-400 text-sm mb-2">Estimated Annual Footprint</div>
        <div className="text-4xl font-bold text-green-50 mb-1">
          {formatCO2(profile.estimatedAnnualFootprintKg)}
        </div>
        <div className="text-green-400 text-sm">
          CO₂ per year (US average: ~16 tonnes)
        </div>
      </motion.div>

      {/* Top Impact Areas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <h3 className="text-green-50 font-semibold mb-4 text-center">
          Your Biggest Opportunities
        </h3>
        <div className="space-y-3">
          {profile.topImpactAreas.map((area, index) => {
            const info = categoryLabels[area] || {
              label: area,
              abbr: 'X',
              color: 'bg-green-600',
            }
            return (
              <motion.div
                key={area}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center gap-4 bg-[#1a2e1a] rounded-xl p-4 border border-green-800/30"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center`}
                >
                  <span className="text-white font-bold">{info.abbr}</span>
                </div>
                <div className="flex-1">
                  <div className="text-green-50 font-medium">{info.label}</div>
                  <div className="text-green-400 text-sm">
                    #{index + 1} impact area
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        onClick={handleStart}
        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-semibold
                   rounded-xl transition-colors text-lg"
      >
        Get Your First Action
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center text-green-400 text-sm mt-4"
      >
        {getFrequencyLabel(profile.actionFrequency || 'daily')}
      </motion.p>
    </motion.div>
  )
}
