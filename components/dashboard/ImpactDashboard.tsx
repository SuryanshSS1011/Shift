'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, Metric, Text } from '@tremor/react'
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

  // Progress toward monthly goal (30 kg CO2)
  const monthlyGoal = 30
  const progressPercent = Math.min((totalCo2SavedKg / monthlyGoal) * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-green-50">
        Your Total Impact
      </h3>

      {/* Main Stats - Tremor Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
          <Text className="!text-green-400">CO₂ Saved</Text>
          <Metric className="!text-green-50">{totalCo2SavedKg.toFixed(1)}</Metric>
          <Text className="!text-green-400/70">kg</Text>
        </Card>
        <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
          <Text className="!text-green-400">Money Saved</Text>
          <Metric className="!text-green-50">${totalDollarSaved.toFixed(0)}</Metric>
          <Text className="!text-green-400/70">total</Text>
        </Card>
        <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
          <Text className="!text-green-400">Actions</Text>
          <Metric className="!text-green-50">{totalActionsCompleted}</Metric>
          <Text className="!text-green-400/70">completed</Text>
        </Card>
      </div>

      {/* Monthly Progress */}
      <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
        <div className="flex justify-between items-center mb-3">
          <Text className="!text-green-400">Monthly Goal Progress</Text>
          <Text className="!text-green-50 font-medium">
            {totalCo2SavedKg.toFixed(1)} / {monthlyGoal} kg
          </Text>
        </div>
        {/* Custom Progress Bar */}
        <div className="w-full h-3 bg-[#0f1a0f] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <Text className="!text-green-400/70 mt-2 text-center">
          {progressPercent >= 100
            ? 'Goal achieved!'
            : `${(monthlyGoal - totalCo2SavedKg).toFixed(1)} kg to go`}
        </Text>
      </Card>

      {/* Equivalencies */}
      {totalCo2SavedKg > 0 && (
        <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
          <Text className="!text-green-400 mb-3">That&apos;s equivalent to...</Text>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0f1a0f] rounded-lg p-3 text-center">
              <div className="text-green-50 font-semibold text-lg">
                {equivalencies.milesNotDriven}
              </div>
              <div className="text-green-400 text-xs">miles not driven</div>
            </div>
            <div className="bg-[#0f1a0f] rounded-lg p-3 text-center">
              <div className="text-green-50 font-semibold text-lg">
                {equivalencies.phoneCharges}
              </div>
              <div className="text-green-400 text-xs">phone charges</div>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  )
}
