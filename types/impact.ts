export interface ImpactTotals {
  totalCo2SavedKg: number
  totalDollarSaved: number
  totalActionsCompleted: number
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActionDate: string | null
  streakFreezeAvailable: boolean
}

export interface CO2Equivalencies {
  milesNotDriven: number
  treePlantedDays: number
  phoneCharges: number
  streamingHours: number
}
