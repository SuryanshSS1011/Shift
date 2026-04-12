'use client'

import { useMemo } from 'react'
import { AreaChart } from '@tremor/react'
import { motion } from 'framer-motion'
import type { ForecastDataPoint } from '@/types/grid'

interface ForecastChartProps {
  forecast: ForecastDataPoint[]
  currentHour?: number
  bestWindow?: { startHour: number; endHour: number }
  isLoading?: boolean
}

// Format hour for display
function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12a'
  if (hour === 12) return '12p'
  if (hour < 12) return `${hour}a`
  return `${hour - 12}p`
}

// Get color class based on intensity
function getIntensityColorClass(intensity: number): string {
  if (intensity < 200) return 'green'
  if (intensity < 400) return 'yellow'
  return 'red'
}

export function ForecastChart({
  forecast,
  currentHour,
  bestWindow,
  isLoading = false,
}: ForecastChartProps) {
  const chartData = useMemo(() => {
    return forecast.map((point) => {
      const date = new Date(point.datetime)
      const hour = date.getHours()
      const isBestWindow = bestWindow && hour >= bestWindow.startHour && hour < bestWindow.endHour
      const isCurrent = hour === currentHour

      return {
        hour: formatHour(hour),
        'Carbon Intensity': point.carbonIntensity,
        isBestWindow,
        isCurrent,
      }
    })
  }, [forecast, bestWindow, currentHour])

  // Determine dominant color based on average intensity
  const avgIntensity = useMemo(() => {
    if (forecast.length === 0) return 280
    return forecast.reduce((sum, p) => sum + p.carbonIntensity, 0) / forecast.length
  }, [forecast])

  const chartColor = getIntensityColorClass(avgIntensity)

  if (isLoading) {
    return (
      <div className="h-[160px] bg-[#1a2e1a]/50 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-green-600 text-sm">Loading forecast...</span>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[160px] bg-[#1a2e1a]/50 rounded-lg flex items-center justify-center">
        <span className="text-green-600 text-sm">No forecast data available</span>
      </div>
    )
  }

  // Fixed scale for consistent severity zones: 0-200 green, 200-400 yellow, 400+ red
  const yMin = 0
  const yMax = 500

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-[160px] w-full relative"
    >
      {/* Severity color bands - fixed zones */}
      <div className="absolute inset-0 flex flex-col pointer-events-none overflow-hidden rounded" style={{ left: '48px', right: '8px', top: '8px', bottom: '24px' }}>
        <div className="bg-red-500/8 h-[20%] border-b border-red-500/20" /> {/* 400-500 */}
        <div className="bg-yellow-500/8 h-[40%] border-b border-yellow-500/20" /> {/* 200-400 */}
        <div className="bg-green-500/8 h-[40%]" /> {/* 0-200 */}
      </div>
      <AreaChart
        data={chartData}
        index="hour"
        categories={['Carbon Intensity']}
        colors={[chartColor]}
        showLegend={false}
        showGridLines={false}
        showYAxis={true}
        showXAxis={true}
        yAxisWidth={48}
        minValue={yMin}
        maxValue={yMax}
        className="h-full relative z-10"
        curveType="monotone"
        valueFormatter={(value) => `${Math.round(value)}g`}
        customTooltip={({ payload, active }) => {
          if (!active || !payload || payload.length === 0) return null
          const data = payload[0].payload
          const intensity = data['Carbon Intensity']
          const colorClass = getIntensityColorClass(intensity)
          const colorMap: Record<string, string> = {
            green: 'bg-green-500',
            yellow: 'bg-yellow-500',
            red: 'bg-red-500',
          }
          return (
            <div className="bg-[#1a2e1a] border border-green-800/50 rounded-lg p-2 shadow-lg">
              <p className="text-green-300 text-xs font-medium">{data.hour}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${colorMap[colorClass]}`} />
                <span className="text-green-50 text-sm font-semibold">
                  {Math.round(intensity)} gCO₂/kWh
                </span>
              </div>
              {data.isBestWindow && (
                <p className="text-green-400 text-xs mt-1">Best time window</p>
              )}
              {data.isCurrent && (
                <p className="text-green-300 text-xs mt-1">Current hour</p>
              )}
            </div>
          )
        }}
      />
    </motion.div>
  )
}
