'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { kgToEquivalencies } from '@/lib/emissions/equivalencies'

interface ImpactDashboardProps {
  totalCo2SavedKg: number
  totalDollarSaved: number
  totalActionsCompleted: number
}

export function ImpactDashboard({
  totalCo2SavedKg,
  totalDollarSaved,
  totalActionsCompleted,
}: ImpactDashboardProps) {
  const equivalencies = useMemo(
    () => kgToEquivalencies(totalCo2SavedKg),
    [totalCo2SavedKg]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a2e1a] rounded-2xl p-6 border border-green-800/30"
    >
      <h3 className="text-lg font-semibold text-green-50 mb-4">
        Your Total Impact
      </h3>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-50">
            {totalCo2SavedKg.toFixed(1)}
          </div>
          <div className="text-green-400 text-xs">kg CO₂</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-50">
            ${totalDollarSaved.toFixed(0)}
          </div>
          <div className="text-green-400 text-xs">saved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-50">
            {totalActionsCompleted}
          </div>
          <div className="text-green-400 text-xs">actions</div>
        </div>
      </div>

      {/* Equivalencies */}
      {totalCo2SavedKg > 0 && (
        <div className="pt-4 border-t border-green-800/30">
          <p className="text-green-400 text-sm mb-3">That&apos;s like...</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0f1a0f] rounded-lg p-3 text-center">
              <div className="text-green-50 font-semibold">
                {equivalencies.milesNotDriven}
              </div>
              <div className="text-green-400 text-xs">miles not driven</div>
            </div>
            <div className="bg-[#0f1a0f] rounded-lg p-3 text-center">
              <div className="text-green-50 font-semibold">
                {equivalencies.phoneCharges}
              </div>
              <div className="text-green-400 text-xs">phone charges</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
