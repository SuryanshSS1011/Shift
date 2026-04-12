import type { ActionCategory } from './action'

export type GoalDuration = 7 | 14 | 21 | 30
export type ActionFrequency = 'daily' | 'every_other_day' | 'twice_weekly'
export type PreferredTime = 'morning' | 'afternoon' | 'evening'
export type DifficultyPreference = 'start_easy' | 'moderate' | 'challenge_me'

export interface OnboardingAnswers {
  commuteType: 'drive' | 'transit' | 'bike_walk' | 'wfh' | 'mixed'
  dietPattern: 'meat_most_days' | 'chicken_fish' | 'mostly_plant' | 'vegan_vegetarian'
  livingSituation: 'city_apartment' | 'urban_house' | 'suburbs' | 'rural'
  primaryBarrier: 'time' | 'cost' | 'knowledge' | 'overwhelmed'
  primaryMotivation: 'planet' | 'money' | 'health' | 'community'
  // New goal-setting fields
  goalDuration: GoalDuration
  actionFrequency: ActionFrequency
  preferredTime: PreferredTime
  difficultyPreference: DifficultyPreference
  focusAreas: ActionCategory[] // User selects 2-3 categories
  city: string
  homeAddress?: string
  workAddress?: string
}

export interface UserProfile {
  id: string
  sessionId: string
  city: string
  commuteType: OnboardingAnswers['commuteType']
  commuteDistanceMiles: number | null
  dietPattern: OnboardingAnswers['dietPattern']
  livingSituation: OnboardingAnswers['livingSituation']
  primaryBarrier: OnboardingAnswers['primaryBarrier']
  primaryMotivation: OnboardingAnswers['primaryMotivation']
  // Goal and preference fields
  goalDuration: GoalDuration
  goalStartDate: string
  goalEndDate: string
  actionFrequency: ActionFrequency
  preferredTime: PreferredTime
  difficultyPreference: DifficultyPreference
  focusAreas: ActionCategory[]
  // AI-generated fields
  aiProfileSummary: string
  topImpactAreas: ActionCategory[]
  estimatedAnnualFootprintKg: number
  createdAt: string
}
