'use client'

import { motion } from 'framer-motion'
import { Clock, Zap, Leaf } from 'lucide-react'
import type { IntensityLevel } from '@/types/grid'

interface BestTimeBadgeProps {
  bestTimeLabel: string
  currentLevel: IntensityLevel
  avgIntensity: number
  currentIntensity?: number
}

function getLevelConfig(level: IntensityLevel) {
  switch (level) {
    case 'low':
      return {
        icon: Leaf,
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        textColor: 'text-green-400',
        iconColor: 'text-green-400',
        message: 'Grid is clean now!',
        subMessage: 'Great time for energy-intensive tasks',
      }
    case 'moderate':
      return {
        icon: Clock,
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        textColor: 'text-yellow-400',
        iconColor: 'text-yellow-400',
        message: 'Best time today:',
        subMessage: 'Consider timing non-urgent usage',
      }
    case 'high':
      return {
        icon: Zap,
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-400',
        iconColor: 'text-red-400',
        message: 'Wait until:',
        subMessage: 'Grid is high-carbon right now',
      }
  }
}

export function BestTimeBadge({
  bestTimeLabel,
  currentLevel,
  avgIntensity,
  currentIntensity,
}: BestTimeBadgeProps) {
  const config = getLevelConfig(currentLevel)
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl
        ${config.bgColor} border ${config.borderColor}
      `}
    >
      <div className={`p-2 rounded-lg ${config.bgColor}`}>
        <Icon className={`w-5 h-5 ${config.iconColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.message}
          </span>
          {currentLevel !== 'low' && (
            <span className="text-green-50 font-semibold text-sm">
              {bestTimeLabel}
            </span>
          )}
        </div>
        <p className="text-green-400 text-xs mt-0.5">
          {config.subMessage}
        </p>
      </div>

      {currentIntensity !== undefined && (
        <div className="text-right">
          <span className={`text-lg font-bold ${config.textColor}`}>
            {Math.round(currentIntensity)}
          </span>
          <p className="text-green-500 text-xs">gCO₂/kWh</p>
        </div>
      )}
    </motion.div>
  )
}
