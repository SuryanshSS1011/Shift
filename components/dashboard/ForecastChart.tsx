'use client'

import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts'
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

// Get color based on intensity
function getIntensityColor(intensity: number): string {
  if (intensity < 200) return '#22c55e' // green-500
  if (intensity < 400) return '#eab308' // yellow-500
  return '#ef4444' // red-500
}

export function ForecastChart({
  forecast,
  currentHour,
  bestWindow,
  isLoading = false,
}: ForecastChartProps) {
  const chartData = useMemo(() => {
    return forecast.map((point, index) => {
      const date = new Date(point.datetime)
      const hour = date.getHours()
      return {
        hour,
        hourLabel: formatHour(hour),
        intensity: point.carbonIntensity,
        fill: getIntensityColor(point.carbonIntensity),
        index,
      }
    })
  }, [forecast])

  // Calculate Y-axis domain with some padding
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 500]
    const min = Math.min(...chartData.map(d => d.intensity))
    const max = Math.max(...chartData.map(d => d.intensity))
    return [Math.floor(min / 50) * 50, Math.ceil(max / 50) * 50 + 50]
  }, [chartData])

  if (isLoading) {
    return (
      <div className="h-[140px] bg-[#1a2e1a]/50 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-green-600 text-sm">Loading forecast...</span>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[140px] bg-[#1a2e1a]/50 rounded-lg flex items-center justify-center">
        <span className="text-green-600 text-sm">No forecast data available</span>
      </div>
    )
  }

  const nowIndex = currentHour !== undefined
    ? chartData.findIndex(d => d.hour === currentHour)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-[140px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="hourLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#86efac' }}
            interval={5}
          />
          <YAxis
            domain={yDomain}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#86efac' }}
            tickFormatter={(value) => `${value}`}
          />

          {/* Best window highlight */}
          {bestWindow && (
            <ReferenceArea
              x1={chartData.findIndex(d => d.hour === bestWindow.startHour)}
              x2={chartData.findIndex(d => d.hour === bestWindow.endHour) || chartData.findIndex(d => d.hour === bestWindow.startHour) + 2}
              fill="#22c55e"
              fillOpacity={0.15}
              stroke="#22c55e"
              strokeOpacity={0.3}
            />
          )}

          {/* Current time indicator */}
          {nowIndex >= 0 && (
            <ReferenceLine
              x={nowIndex}
              stroke="#f0fdf4"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}

          <Area
            type="monotone"
            dataKey="intensity"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#intensityGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
