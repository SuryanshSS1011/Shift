import type { CO2Equivalencies } from '@/types/impact'

// 1 kg CO₂ equivalencies based on EPA/DEFRA data
const KG_TO_MILES = 2.48
const KG_TO_TREE_DAYS = 0.11
const KG_TO_PHONE_CHARGES = 121
const KG_TO_STREAMING_HOURS = 2.2

export function kgToEquivalencies(kg: number): CO2Equivalencies {
  return {
    milesNotDriven: Math.round(kg * KG_TO_MILES * 10) / 10,
    treePlantedDays: Math.round(kg * KG_TO_TREE_DAYS * 10) / 10,
    phoneCharges: Math.round(kg * KG_TO_PHONE_CHARGES),
    streamingHours: Math.round(kg * KG_TO_STREAMING_HOURS * 10) / 10,
  }
}

export function formatEquivalency(kg: number): string {
  const miles = kg * KG_TO_MILES
  return `= ${miles.toFixed(1)} miles not driven`
}
