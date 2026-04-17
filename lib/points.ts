import type { DifficultyLevel } from '@/types/action'
import type { ActionFrequency } from '@/types/user'

// Level definitions
export type LevelName = 'Seedling' | 'Sprout' | 'Sapling' | 'Tree' | 'Forest'

export interface LevelInfo {
  level: LevelName
  emoji: string
  nextLevelAt: number
  minPoints: number
}

// Level thresholds
const LEVEL_THRESHOLDS: { level: LevelName; emoji: string; minPoints: number }[] = [
  { level: 'Forest', emoji: '🌍', minPoints: 5000 },
  { level: 'Tree', emoji: '🌲', minPoints: 2000 },
  { level: 'Sapling', emoji: '🌳', minPoints: 500 },
  { level: 'Sprout', emoji: '🌿', minPoints: 100 },
  { level: 'Seedling', emoji: '🌱', minPoints: 0 },
]

// Difficulty multipliers
const DIFFICULTY_MULTIPLIER: Record<DifficultyLevel, number> = {
  easy: 1.0,
  medium: 1.5,
  challenge: 2.0,
}

// Frequency multipliers (based on user's actionFrequency setting)
const FREQUENCY_MULTIPLIER: Record<ActionFrequency, number> = {
  hourly: 3.0,
  multiple_daily: 2.0,
  daily: 1.0,
  every_other_day: 0.8,
  twice_weekly: 0.6,
}

// Get frequency multiplier from categorical frequency
export function getFrequencyMultiplier(frequency: ActionFrequency): number {
  return FREQUENCY_MULTIPLIER[frequency] || 1.0
}

/**
 * Compute points for an action at generation time
 * Formula: (co2SavingsKg × 10 + dollarSavings × 2) × difficultyMultiplier × frequencyMultiplier
 *
 * Points are a gamification layer - they do NOT affect displayed CO₂ or dollar savings
 */
export function computePoints(
  co2SavingsKg: number,
  dollarSavings: number,
  difficulty: DifficultyLevel,
  frequency: ActionFrequency = 'daily'
): number {
  const difficultyMultiplier = DIFFICULTY_MULTIPLIER[difficulty] || 1.0
  const frequencyMultiplier = getFrequencyMultiplier(frequency)

  const basePoints = co2SavingsKg * 10 + dollarSavings * 2
  return Math.round(basePoints * difficultyMultiplier * frequencyMultiplier)
}

/**
 * Compute level from total points - always derived, never stored
 */
export function computeLevel(totalPoints: number): LevelInfo {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalPoints >= threshold.minPoints) {
      // Find next level threshold
      const currentIndex = LEVEL_THRESHOLDS.indexOf(threshold)
      const nextLevelAt = currentIndex > 0
        ? LEVEL_THRESHOLDS[currentIndex - 1].minPoints
        : Infinity

      return {
        level: threshold.level,
        emoji: threshold.emoji,
        nextLevelAt,
        minPoints: threshold.minPoints,
      }
    }
  }

  // Default to Seedling
  return {
    level: 'Seedling',
    emoji: '🌱',
    nextLevelAt: 100,
    minPoints: 0,
  }
}

/**
 * Calculate progress to next level as percentage
 */
export function getLevelProgress(totalPoints: number): number {
  const levelInfo = computeLevel(totalPoints)

  if (levelInfo.nextLevelAt === Infinity) {
    return 100 // Max level achieved
  }

  const pointsInCurrentLevel = totalPoints - levelInfo.minPoints
  const pointsNeededForNextLevel = levelInfo.nextLevelAt - levelInfo.minPoints

  return Math.round((pointsInCurrentLevel / pointsNeededForNextLevel) * 100)
}
