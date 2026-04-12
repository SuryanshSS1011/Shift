import type { MicroAction } from '@/types/action'

export interface ImpactProjection {
  projectedCo2Kg: number
  projectedDollarSavings: number
  projectedPoints: number
  treeEquivalent: number
  milesEquivalent: number
  daysRemaining: number
  dailyAverageCo2: number
  dailyAverageDollars: number
  dailyAveragePoints: number
}

// Equivalency factors
const KG_CO2_PER_TREE_DAY = 0.11 // 1 kg CO2 = 0.11 tree-planted-days
const KG_CO2_PER_MILE = 2.48 // 1 kg CO2 = 2.48 miles not driven

/**
 * Project forward impact based on user's recent action history
 *
 * @param recentActions - Array of user's recent actions (completed or not)
 * @param goalDays - User's goal duration (7, 14, 21, or 30 days)
 * @param daysElapsed - Days since user started (from goalStartDate to now)
 * @returns ImpactProjection or null if fewer than 3 completed actions
 */
export function projectImpact(
  recentActions: MicroAction[],
  goalDays: number,
  daysElapsed: number
): ImpactProjection | null {
  // Only show projection after 3+ completed actions
  const completed = recentActions.filter((a) => a.completed)

  if (completed.length < 3) {
    return null
  }

  // Calculate averages from completed actions
  const totalCo2 = completed.reduce((sum, a) => sum + a.co2SavingsKg, 0)
  const totalDollars = completed.reduce((sum, a) => sum + a.dollarSavings, 0)
  const totalPoints = completed.reduce((sum, a) => sum + (a.points || 0), 0)

  // Use days elapsed or default to number of completed actions (if they completed 1/day)
  const effectiveDays = Math.max(daysElapsed, 1)

  const dailyAverageCo2 = totalCo2 / effectiveDays
  const dailyAverageDollars = totalDollars / effectiveDays
  const dailyAveragePoints = totalPoints / effectiveDays

  // Calculate days remaining in goal period
  const daysRemaining = Math.max(goalDays - daysElapsed, 0)

  // Project forward
  const projectedCo2Kg = dailyAverageCo2 * daysRemaining
  const projectedDollarSavings = dailyAverageDollars * daysRemaining
  const projectedPoints = Math.round(dailyAveragePoints * daysRemaining)

  // Calculate equivalencies
  const treeEquivalent = Math.round(projectedCo2Kg * KG_CO2_PER_TREE_DAY)
  const milesEquivalent = Math.round(projectedCo2Kg * KG_CO2_PER_MILE)

  return {
    projectedCo2Kg,
    projectedDollarSavings,
    projectedPoints,
    treeEquivalent,
    milesEquivalent,
    daysRemaining,
    dailyAverageCo2,
    dailyAverageDollars,
    dailyAveragePoints,
  }
}

/**
 * Calculate days elapsed since a start date
 */
export function calculateDaysElapsed(goalStartDate: string): number {
  const start = new Date(goalStartDate)
  const now = new Date()

  // Reset time to compare just dates
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)

  const diffMs = now.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  return Math.max(diffDays, 0)
}
