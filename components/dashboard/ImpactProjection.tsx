'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Card, Text } from '@tremor/react'
import { ChevronDown, ChevronUp, Lock, TrendingUp } from 'lucide-react'
import { projectImpact, calculateDaysElapsed } from '@/lib/emissions/projection'
import type { MicroAction } from '@/types/action'

interface ImpactProjectionProps {
  recentActions: MicroAction[]
  goalDuration: number
  goalStartDate: string
}

// Animated number counter
function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => {
    if (suffix === ' kg' || suffix === '') {
      return latest.toFixed(1)
    }
    return Math.round(latest).toString()
  })

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: 'easeOut',
    })
    return controls.stop
  }, [count, value])

  return (
    <motion.span>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  )
}

export function ImpactProjection({
  recentActions,
  goalDuration,
  goalStartDate,
}: ImpactProjectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const daysElapsed = useMemo(
    () => calculateDaysElapsed(goalStartDate),
    [goalStartDate]
  )

  const projection = useMemo(
    () => projectImpact(recentActions, goalDuration, daysElapsed),
    [recentActions, goalDuration, daysElapsed]
  )

  const completedCount = recentActions.filter((a) => a.completed).length

  // Locked state - need 3 completed actions
  if (!projection) {
    return (
      <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-900/50 flex items-center justify-center">
            <Lock className="w-5 h-5 text-green-400/50" />
          </div>
          <div className="flex-1">
            <Text className="!text-green-50 font-medium">Impact Projection</Text>
            <Text className="!text-green-400/70 text-sm">
              Complete {3 - completedCount} more action{3 - completedCount !== 1 ? 's' : ''} to unlock
            </Text>
          </div>
        </div>
        {/* Progress dots */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < completedCount ? 'bg-green-500' : 'bg-green-900/50'
              }`}
            />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-left">
            <Text className="!text-green-50 font-medium">Impact Projection</Text>
            <Text className="!text-green-400/70 text-sm">
              {projection.daysRemaining} days remaining in your goal
            </Text>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-green-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-green-400" />
        )}
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 space-y-4"
        >
          {/* Main projection message */}
          <div className="bg-[#0f1a0f] rounded-xl p-4">
            <p className="text-green-50 text-lg font-medium mb-2">
              At your current pace...
            </p>
            <p className="text-green-300">
              You&apos;ll save{' '}
              <span className="text-green-50 font-bold">
                <AnimatedNumber value={projection.projectedCo2Kg} suffix=" kg" />
              </span>{' '}
              CO₂ and{' '}
              <span className="text-green-50 font-bold">
                <AnimatedNumber value={projection.projectedDollarSavings} prefix="$" />
              </span>{' '}
              in the next {projection.daysRemaining} days
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0f1a0f] rounded-lg p-3 text-center">
              <div className="text-green-50 font-bold text-lg">
                <AnimatedNumber value={projection.projectedPoints} />
              </div>
              <div className="text-green-400/70 text-xs">points</div>
            </div>
            <div className="bg-[#0f1a0f] rounded-lg p-3 text-center">
              <div className="text-green-50 font-bold text-lg">
                <AnimatedNumber value={projection.treeEquivalent} />
              </div>
              <div className="text-green-400/70 text-xs">🌳 trees</div>
            </div>
            <div className="bg-[#0f1a0f] rounded-lg p-3 text-center">
              <div className="text-green-50 font-bold text-lg">
                <AnimatedNumber value={projection.milesEquivalent} />
              </div>
              <div className="text-green-400/70 text-xs">miles saved</div>
            </div>
          </div>

          {/* Daily averages */}
          <div className="text-center text-green-400/70 text-sm">
            Averaging {projection.dailyAverageCo2.toFixed(2)} kg CO₂/day · ${projection.dailyAverageDollars.toFixed(2)}/day
          </div>
        </motion.div>
      )}
    </Card>
  )
}
