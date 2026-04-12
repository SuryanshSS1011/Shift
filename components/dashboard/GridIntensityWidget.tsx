'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

interface GridIntensityWidgetProps {
  zone: string
  carbonIntensity: number
  renewablePercent: number
  isLoading?: boolean
}

// Zone display names
const ZONE_NAMES: Record<string, string> = {
  'US-NY-NYIS': 'NYC',
  'US-CAL-CISO': 'California',
  'US-TEX-ERCO': 'Texas',
  'US-MIDA-PJM': 'Mid-Atlantic',
}

function getIntensityLevel(carbonIntensity: number): {
  color: string
  bgColor: string
  label: string
  suggestion: string
} {
  if (carbonIntensity < 200) {
    return {
      color: 'text-green-400',
      bgColor: 'bg-green-500',
      label: 'Low Carbon',
      suggestion: 'Great time to run appliances',
    }
  } else if (carbonIntensity < 400) {
    return {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500',
      label: 'Moderate',
      suggestion: 'Consider timing non-urgent usage',
    }
  } else {
    return {
      color: 'text-red-400',
      bgColor: 'bg-red-500',
      label: 'High Carbon',
      suggestion: 'Consider conserving energy today',
    }
  }
}

export function GridIntensityWidget({
  zone,
  carbonIntensity,
  renewablePercent,
  isLoading = false,
}: GridIntensityWidgetProps) {
  if (isLoading) {
    return (
      <div className="bg-[#1a2e1a] rounded-xl p-4 border border-green-800/30 animate-pulse">
        <div className="h-4 bg-green-800/30 rounded w-1/3 mb-3" />
        <div className="h-6 bg-green-800/30 rounded w-2/3 mb-2" />
        <div className="h-4 bg-green-800/30 rounded w-1/2" />
      </div>
    )
  }

  const intensity = getIntensityLevel(carbonIntensity)
  const zoneName = ZONE_NAMES[zone] || zone

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a2e1a] rounded-xl p-4 border border-green-800/30"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-green-300 text-sm font-medium">
          Your {zoneName} grid right now
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3">
        {/* Renewable percent */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${intensity.bgColor}`} />
          <span className="text-green-50 font-semibold">
            {Math.round(renewablePercent)}% renewable
          </span>
        </div>

        {/* Divider */}
        <span className="text-green-600">|</span>

        {/* Carbon intensity */}
        <span className={`text-sm ${intensity.color}`}>
          {Math.round(carbonIntensity)} gCO2/kWh
        </span>
      </div>

      {/* Suggestion */}
      <p className="text-green-400 text-sm flex items-center gap-1">
        <span className="text-green-500">→</span>
        {intensity.suggestion}
      </p>
    </motion.div>
  )
}
