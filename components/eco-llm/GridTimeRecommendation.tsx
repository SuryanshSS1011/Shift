'use client'

import { useMemo } from 'react'
import { Card, Text } from '@tremor/react'

interface ForecastHour {
  hour: number
  intensity: number
  isCurrent: boolean
}

function generateGridForecast(): ForecastHour[] {
  const now = new Date()
  const forecast: ForecastHour[] = []

  for (let i = -6; i < 18; i++) {
    const dt = new Date(now)
    dt.setHours(now.getHours() + i, 0, 0, 0)
    const hour = dt.getHours()

    let intensity: number
    if (hour >= 10 && hour <= 15) {
      // Solar peak - low carbon
      intensity = 130 + Math.sin(((hour - 10) * Math.PI) / 5) * 40
    } else if (hour >= 6 && hour < 10) {
      // Morning ramp down toward solar
      intensity = 250 - (hour - 6) * 25
    } else if (hour > 15 && hour < 17) {
      // Afternoon ramp up from solar
      intensity = 180 + (hour - 15) * 50
    } else if (hour >= 17 && hour <= 21) {
      // Evening peak - high carbon
      intensity = 340 + Math.sin(((hour - 17) * Math.PI) / 4) * 80
    } else if (hour > 21) {
      // Post-peak decline
      intensity = 320 - (hour - 21) * 25
    } else {
      // Overnight slow decline
      intensity = 240 - hour * 5
    }

    // Add slight deterministic variation
    intensity += ((hour * 7 + dt.getDate() * 3) % 20) - 10

    forecast.push({
      hour,
      intensity: Math.round(Math.max(80, Math.min(450, intensity))),
      isCurrent: i === 0,
    })
  }
  return forecast
}

function getIntensityLevel(intensity: number): 'low' | 'moderate' | 'high' {
  if (intensity < 200) return 'low'
  if (intensity < 340) return 'moderate'
  return 'high'
}

function formatHour12(h: number): string {
  if (h === 0 || h === 24) return '12a'
  if (h === 12) return '12p'
  return h < 12 ? `${h}a` : `${h - 12}p`
}

export function GridTimeRecommendation() {
  const forecast = useMemo(() => generateGridForecast(), [])
  const currentEntry = forecast.find((f) => f.isCurrent) || forecast[6]
  const currentLevel = getIntensityLevel(currentEntry.intensity)

  // Find best hours (lowest intensity) in the next 12 hours
  const futureHours = forecast.filter(
    (f) => forecast.indexOf(f) >= forecast.findIndex((x) => x.isCurrent)
  )
  const sortedByIntensity = [...futureHours].sort(
    (a, b) => a.intensity - b.intensity
  )
  const bestHours = sortedByIntensity.slice(0, 3)

  const maxIntensity = Math.max(...forecast.map((f) => f.intensity))

  const levelColors = {
    low: { dot: 'bg-green-500', text: 'text-green-400', label: 'Low Carbon' },
    moderate: {
      dot: 'bg-yellow-500',
      text: 'text-yellow-400',
      label: 'Moderate',
    },
    high: { dot: 'bg-red-500', text: 'text-red-400', label: 'High Carbon' },
  }

  const barColors = {
    low: 'bg-green-500',
    moderate: 'bg-yellow-500',
    high: 'bg-red-500',
  }

  return (
    <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
      <h3 className="text-lg font-semibold text-green-50 mb-2">
        Best Time to Use LLMs
      </h3>
      <Text className="!text-green-400/70 text-sm mb-4">
        US grid carbon intensity forecast (heuristic-based)
      </Text>

      {/* Current Status */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-[#0f1a0f] rounded-lg">
        <span
          className={`w-3 h-3 rounded-full ${levelColors[currentLevel].dot}`}
        />
        <span className={`font-medium ${levelColors[currentLevel].text}`}>
          {levelColors[currentLevel].label}
        </span>
        <span className="text-green-400/70 text-sm">
          · {currentEntry.intensity} gCO₂/kWh
        </span>
      </div>

      {/* Forecast Chart */}
      <div className="flex items-end gap-[2px] h-20 mb-2">
        {forecast.map((f, i) => {
          const level = getIntensityLevel(f.intensity)
          const height = Math.max(4, Math.round((f.intensity / maxIntensity) * 72))
          return (
            <div
              key={i}
              className={`flex-1 rounded-t ${barColors[level]} ${
                f.isCurrent ? 'ring-2 ring-white ring-offset-1 ring-offset-[#1a2e1a]' : ''
              } ${
                forecast.indexOf(f) < forecast.findIndex((x) => x.isCurrent)
                  ? 'opacity-40'
                  : ''
              }`}
              style={{ height: `${height}px` }}
              title={`${formatHour12(f.hour)}: ${f.intensity} gCO₂`}
            />
          )
        })}
      </div>

      {/* Time Labels */}
      <div className="flex justify-between text-xs text-green-400/50 mb-4">
        <span>{formatHour12(forecast[0].hour)}</span>
        <span>Now</span>
        <span>{formatHour12(forecast[forecast.length - 1].hour)}</span>
      </div>

      {/* Recommendations */}
      <div className="bg-[#0f1a0f] rounded-lg p-3">
        <Text className="!text-green-400 mb-2 font-medium">
          Recommended hours:
        </Text>
        <div className="flex flex-wrap gap-2">
          {bestHours.map((h, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm"
            >
              {formatHour12(h.hour)} ({h.intensity} gCO₂)
            </span>
          ))}
        </div>
        <Text className="!text-green-400/60 text-xs mt-2">
          Lower intensity = greener energy mix = less CO₂ per query
        </Text>
      </div>
    </Card>
  )
}
