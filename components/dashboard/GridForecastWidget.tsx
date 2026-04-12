'use client'

import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { ForecastChart } from './ForecastChart'
import type { GridForecastResponse } from '@/types/grid'

interface GridForecastWidgetProps {
  forecast: GridForecastResponse | null
  isLoading?: boolean
}

export function GridForecastWidget({
  forecast,
  isLoading = false,
}: GridForecastWidgetProps) {
  if (isLoading) {
    return (
      <div className="bg-[#1a2e1a] rounded-xl p-4 border border-green-800/30 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-green-800/30 rounded" />
          <div className="h-4 bg-green-800/30 rounded w-1/3" />
        </div>
        <div className="h-32 bg-green-800/30 rounded mb-3" />
        <div className="h-4 bg-green-800/30 rounded w-1/2" />
      </div>
    )
  }

  if (!forecast) {
    return (
      <div className="bg-[#1a2e1a] rounded-xl p-4 border border-green-800/30">
        <div className="flex items-center gap-2 text-green-500">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm">Unable to load forecast</span>
        </div>
      </div>
    )
  }

  const currentHour = new Date().getHours()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a2e1a] rounded-xl border border-green-800/30 p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-green-400" />
        <span className="text-green-300 text-sm font-medium">
          24-Hour Grid Forecast
        </span>
      </div>

      {/* Chart */}
      <div className="pt-3 border-t border-green-800/30">
        <ForecastChart
          forecast={forecast.forecast}
          currentHour={currentHour}
          bestWindow={forecast.bestTime}
        />

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-green-400">&lt;200 Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-green-400">200-400 Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-green-400">&gt;400 High</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
