import type { ActionCategory } from './action'

export interface OnboardingAnswers {
  commuteType: 'drive' | 'transit' | 'bike_walk' | 'wfh' | 'mixed'
  dietPattern: 'meat_most_days' | 'chicken_fish' | 'mostly_plant' | 'vegan_vegetarian'
  livingSituation: 'city_apartment' | 'urban_house' | 'suburbs' | 'rural'
  primaryBarrier: 'time' | 'cost' | 'knowledge' | 'overwhelmed'
  primaryMotivation: 'planet' | 'money' | 'health' | 'community'
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
  aiProfileSummary: string
  topImpactAreas: ActionCategory[]
  estimatedAnnualFootprintKg: number
  createdAt: string
}
