'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { formatCO2 } from '@/lib/emissions/calculator'

interface ProfileRevealProps {
  profile: {
    topImpactAreas: string[]
    estimatedAnnualFootprintKg: number
    aiProfileSummary: string
  }
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
  const router = useRouter()

  const handleStart = () => {
    router.push('/dashboard')
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto px-4"
    >
      {/* Header */}
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
          className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4"
        >
          <span className="text-white text-xl font-bold">S</span>
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
          CO₂ per year (US average: 16,000 kg)
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
        One personalized micro-action per day
      </motion.p>
    </motion.div>
  )
}
