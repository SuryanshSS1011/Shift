import type { LevelName } from '@/lib/points'
import type { ActionCategory } from './action'

export interface ImpactTotals {
  totalCo2SavedKg: number
  totalDollarSaved: number
  totalActionsCompleted: number
  totalPoints: number
  level: LevelName
  levelEmoji: string
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActionDate: string | null
  streakFreezeAvailable: boolean
}

export interface CategoryStreak {
  category: ActionCategory
  currentStreak: number
  longestStreak: number
  lastActionDate: string | null
}

export interface CO2Equivalencies {
  milesNotDriven: number
  treePlantedDays: number
  phoneCharges: number
  streamingHours: number
}

// Eco-LLM tracking types
export type EcoLLMSource = 'action_generation' | 'gemini_prompt' | 'other'

export interface EcoLLMCall {
  id: string
  sessionId: string
  model: string
  inputTokens: number
  outputTokens: number
  energyWh: number
  co2Grams: number
  waterMl: number
  wasCacheHit: boolean
  co2Saved: number
  source: EcoLLMSource
  createdAt: string
}

export interface EcoLLMMetrics {
  totalCalls: number
  totalEnergyWh: number
  totalCo2Grams: number
  totalWaterMl: number
  cacheHits: number
  co2SavedFromCaching: number
  carbonROIRatio: number
  bySource: Record<EcoLLMSource, { calls: number; co2Grams: number }>
}

// Re-export ImpactProjection from the projection module
export type { ImpactProjection } from '@/lib/emissions/projection'
