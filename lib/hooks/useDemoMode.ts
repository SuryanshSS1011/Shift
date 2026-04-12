'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

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

export interface DemoData {
  isDemoMode: boolean
  profile: typeof DEMO_PROFILE
  streak: typeof DEMO_STREAK
  totals: typeof DEMO_TOTALS
  grid: typeof DEMO_GRID
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
    sessionId: 'demo-session-id',
  }
}
