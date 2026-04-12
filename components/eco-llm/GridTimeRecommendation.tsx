'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, Text } from '@tremor/react'
import { Skeleton } from '@/components/ui/skeleton'

interface ForecastHour {
  hour: number
  intensity: number
  isCurrent: boolean
}

interface GridForecastData {
  forecast: Array<{
    datetime: string
    carbonIntensity: number
  }>
  bestTimes: Array<{
    datetime: string
    carbonIntensity: number
    level: string
  }>
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
  const [isLoading, setIsLoading] = useState(true)
  const [apiData, setApiData] = useState<GridForecastData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGridForecast = async () => {
      try {
        const sessionId = localStorage.getItem('shift_session_id')
        if (!sessionId) {
          setError('Complete onboarding to see live grid data')
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/grid-forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setApiData(result.data)
          } else {
            setError('Could not load grid forecast')
          }
        } else {
          setError('Grid forecast unavailable')
        }
      } catch (err) {
        setError('Failed to fetch grid data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGridForecast()
  }, [])

  const forecast = useMemo(() => {
    if (!apiData?.forecast) return []
    return apiData.forecast.slice(0, 24).map((f, i) => {
      const dt = new Date(f.datetime)
      return {
        hour: dt.getHours(),
        intensity: Math.round(f.carbonIntensity),
        isCurrent: i === 0,
      }
    })
  }, [apiData])

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

  if (isLoading) {
    return (
      <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-20 w-full" />
      </Card>
    )
  }

  if (error || !apiData || forecast.length === 0) {
    return (
      <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
        <h3 className="text-lg font-semibold text-green-50 mb-2">
          Best Time to Use LLMs
        </h3>
        <Text className="!text-green-400/70 text-sm mb-4">
          Live grid carbon intensity (Electricity Maps)
        </Text>
        <div className="bg-[#0f1a0f] rounded-lg p-4 text-center">
          <Text className="!text-green-400/70">
            {error || 'No grid data available'}
          </Text>
        </div>
      </Card>
    )
  }

  const currentEntry = forecast.find((f) => f.isCurrent) || forecast[0]
  const currentLevel = getIntensityLevel(currentEntry.intensity)

  const bestHours = apiData.bestTimes
    ? apiData.bestTimes.slice(0, 3).map((bt) => ({
        hour: new Date(bt.datetime).getHours(),
        intensity: Math.round(bt.carbonIntensity),
      }))
    : []

  const maxIntensity = Math.max(...forecast.map((f) => f.intensity))

  return (
    <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
      <h3 className="text-lg font-semibold text-green-50 mb-2">
        Best Time to Use LLMs
      </h3>
      <Text className="!text-green-400/70 text-sm mb-4">
        Live grid carbon intensity (Electricity Maps)
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
      {bestHours.length > 0 && (
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
      )}
    </Card>
  )
}
