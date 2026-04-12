export type ActionCategory = 'food' | 'transport' | 'energy' | 'shopping' | 'water' | 'waste'
export type DifficultyLevel = 'easy' | 'medium' | 'challenge'
export type BehavioralFrame = 'cost' | 'values' | 'health' | 'convenience' | 'identity'

export interface ActionCandidate {
  id: string
  category: ActionCategory
  title: string
  descriptionTemplate: string
  co2SavingsKgPerOccurrence: number
  dollarSavingsPerOccurrence: number
  timeRequiredMinutes: number
  difficulty: DifficultyLevel
  behavioralFramePrimary: BehavioralFrame
  equivalencyLabel: string
  sdgTags: number[] // UN SDG IDs (e.g., [13, 7] for energy actions)
  applicableDietPatterns: string[]
  applicableLivingSituations: string[]
  applicableCommuteTypes: string[]
  applicableCities: string[]
}

export interface MicroAction {
  id: string
  userId: string
  actionDate: string
  category: ActionCategory
  title: string
  description: string
  anchorHabit: string
  co2SavingsKg: number
  dollarSavings: number
  timeRequiredMinutes: number
  difficultyLevel: DifficultyLevel
  behavioralFrame: BehavioralFrame
  equivalencyLabel: string
  sdgTags: number[] // UN SDG IDs from the action candidate
  points: number // Computed at generation time
  aiCostCo2Grams: number // Carbon cost of the inference that generated this
  completed: boolean
  completedAt: string | null
  createdAt: string
}

// Re-export UserProfile for knowledge-base.ts
export type { UserProfile } from './user'
