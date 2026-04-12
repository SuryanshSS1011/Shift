'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import type { GridForecastResponse, ForecastDataPoint } from '@/types/grid'

// Demo profile - transit city + meat eater + time-constrained
// This produces compelling, specific actions for judges
const DEMO_PROFILE = {
  city: 'New York',
  commuteType: 'transit',
  dietPattern: 'meat_most_days',
  livingSituation: 'city_apartment',
  primaryBarrier: 'time',
  primaryMotivation: 'planet',
  topImpactAreas: ['food', 'transport', 'energy'],
  estimatedAnnualFootprintKg: 14200,
}

const DEMO_STREAK = {
  current: 12,
  longest: 12,
}

const DEMO_TOTALS = {
  totalCo2SavedKg: 14.4,
  totalDollarSaved: 43.2,
  totalActionsCompleted: 18,
}

const DEMO_GRID = {
  zone: 'US-NY-NYIS',
  carbonIntensity: 287,
  renewablePercent: 34,
  fossilFuelPercent: 66,
}

// Generate demo forecast data for 24 hours
function generateDemoForecast(): ForecastDataPoint[] {
  const now = new Date()
  const forecast: ForecastDataPoint[] = []

  for (let i = 0; i < 24; i++) {
    const hour = (now.getHours() + i) % 24
    const datetime = new Date(now)
    datetime.setHours(hour, 0, 0, 0)
    if (i > 0 && hour < now.getHours()) {
      datetime.setDate(datetime.getDate() + 1)
    }

    // Create realistic demo pattern: green during midday (solar), red during evening peak
    let carbonIntensity: number
    if (hour >= 10 && hour <= 14) {
      carbonIntensity = 165 + Math.random() * 40 // Green: 165-205
    } else if (hour >= 6 && hour < 10) {
      carbonIntensity = 220 + Math.random() * 60 // Yellow morning: 220-280
    } else if (hour > 14 && hour < 17) {
      carbonIntensity = 200 + Math.random() * 50 // Yellow afternoon: 200-250
    } else if (hour >= 17 && hour <= 21) {
      carbonIntensity = 380 + Math.random() * 80 // Red evening peak: 380-460
    } else {
      carbonIntensity = 260 + Math.random() * 60 // Night: 260-320
    }

    forecast.push({
      datetime: datetime.toISOString(),
      carbonIntensity: Math.round(carbonIntensity),
    })
  }

  return forecast
}

const DEMO_GRID_FORECAST: GridForecastResponse = {
  zone: 'US-NY-NYIS',
  forecast: generateDemoForecast(),
  bestTime: {
    label: '11 AM-1 PM',
    startHour: 11,
    endHour: 13,
    intensity: 178,
  },
  currentIntensity: 287,
  currentLevel: 'moderate',
}

export interface DemoData {
  isDemoMode: boolean
  profile: typeof DEMO_PROFILE
  streak: typeof DEMO_STREAK
  totals: typeof DEMO_TOTALS
  grid: typeof DEMO_GRID
  gridForecast: GridForecastResponse
  sessionId: string
}

export function useDemoMode(): DemoData {
  const searchParams = useSearchParams()

  const isDemoMode = useMemo(() => {
    return searchParams.get('demo') === 'true'
  }, [searchParams])

  return {
    isDemoMode,
    profile: DEMO_PROFILE,
    streak: DEMO_STREAK,
    totals: DEMO_TOTALS,
    grid: DEMO_GRID,
    gridForecast: DEMO_GRID_FORECAST,
    sessionId: 'demo-session-id',
  }
}
