import type { CO2Equivalencies } from '@/types/impact'

/**
 * CO₂ equivalencies based on EPA/DEFRA data.
 * All values are per 1 kg of CO₂.
 */
const EQUIVALENCY_FACTORS = {
  // Miles driven in an average car (0.404 kg CO2/mile → 2.48 miles/kg)
  milesNotDriven: 2.48,

  // Days of carbon absorption by one mature tree
  // A tree absorbs ~22 kg CO2/year → 0.06 kg/day → 1/0.06 = ~16.7 days/kg
  // Using simplified 0.11 for easier messaging
  treePlantedDays: 0.11,

  // Phone charges avoided (average smartphone ~0.00826 kg CO2/charge)
  // 1 kg / 0.00826 = 121 charges
  phoneCharges: 121,

  // Hours of video streaming avoided (~0.45 kg CO2/hour Netflix HD)
  // 1 kg / 0.45 = 2.2 hours
  streamingHours: 2.2,

  // Gallons of gasoline not burned (8.89 kg CO2/gallon)
  // 1 kg / 8.89 = 0.11 gallons
  gallonsGasoline: 0.112,

  // Pounds of coal not burned (2.21 kg CO2/lb)
  poundsCoal: 0.45,

  // Incandescent light bulb hours saved (0.06 kg CO2/hour)
  lightbulbHours: 16.7,

  // Plastic bottles not produced (~0.08 kg CO2/bottle)
  plasticBottles: 12.5,

  // Loads of laundry line-dried (~0.69 kg CO2/dryer load)
  laundryLoads: 1.45,

  // Hamburgers not eaten (~3.0 kg CO2/beef burger)
  hamburgersSkipped: 0.33,
}

/**
 * Converts kg CO2 to multiple equivalencies.
 */
export function kgToEquivalencies(kg: number): CO2Equivalencies {
  return {
    milesNotDriven: Math.round(kg * EQUIVALENCY_FACTORS.milesNotDriven * 10) / 10,
    treePlantedDays: Math.round(kg * EQUIVALENCY_FACTORS.treePlantedDays * 10) / 10,
    phoneCharges: Math.round(kg * EQUIVALENCY_FACTORS.phoneCharges),
    streamingHours: Math.round(kg * EQUIVALENCY_FACTORS.streamingHours * 10) / 10,
  }
}

/**
 * Extended equivalencies with more options.
 */
export interface ExtendedEquivalencies extends CO2Equivalencies {
  gallonsGasoline: number
  poundsCoal: number
  lightbulbHours: number
  plasticBottles: number
  laundryLoads: number
  hamburgersSkipped: number
}

/**
 * Converts kg CO2 to extended equivalencies.
 */
export function kgToExtendedEquivalencies(kg: number): ExtendedEquivalencies {
  return {
    ...kgToEquivalencies(kg),
    gallonsGasoline: Math.round(kg * EQUIVALENCY_FACTORS.gallonsGasoline * 100) / 100,
    poundsCoal: Math.round(kg * EQUIVALENCY_FACTORS.poundsCoal * 10) / 10,
    lightbulbHours: Math.round(kg * EQUIVALENCY_FACTORS.lightbulbHours),
    plasticBottles: Math.round(kg * EQUIVALENCY_FACTORS.plasticBottles),
    laundryLoads: Math.round(kg * EQUIVALENCY_FACTORS.laundryLoads * 10) / 10,
    hamburgersSkipped: Math.round(kg * EQUIVALENCY_FACTORS.hamburgersSkipped * 10) / 10,
  }
}

/**
 * Formats a single equivalency as a human-readable string.
 */
export function formatEquivalency(kg: number): string {
  const miles = kg * EQUIVALENCY_FACTORS.milesNotDriven
  return `= ${miles.toFixed(1)} miles not driven`
}

/**
 * Generates the most impactful/relatable equivalency based on CO2 amount.
 * Small amounts get phone charges, medium get miles, large get trees.
 */
export function getBestEquivalency(kg: number): { label: string; icon: string } {
  if (kg < 0.1) {
    const charges = Math.round(kg * EQUIVALENCY_FACTORS.phoneCharges)
    return {
      label: `${charges} phone charge${charges !== 1 ? 's' : ''} saved`,
      icon: 'phone',
    }
  }

  if (kg < 1) {
    const miles = Math.round(kg * EQUIVALENCY_FACTORS.milesNotDriven * 10) / 10
    return {
      label: `${miles} mile${miles !== 1 ? 's' : ''} not driven`,
      icon: 'car',
    }
  }

  if (kg < 5) {
    const bottles = Math.round(kg * EQUIVALENCY_FACTORS.plasticBottles)
    return {
      label: `${bottles} plastic bottle${bottles !== 1 ? 's' : ''} saved`,
      icon: 'recycle',
    }
  }

  if (kg < 20) {
    const streaming = Math.round(kg * EQUIVALENCY_FACTORS.streamingHours)
    return {
      label: `${streaming} hour${streaming !== 1 ? 's' : ''} of streaming`,
      icon: 'tv',
    }
  }

  // Large amounts
  const gallons = Math.round(kg * EQUIVALENCY_FACTORS.gallonsGasoline * 10) / 10
  return {
    label: `${gallons} gallon${gallons !== 1 ? 's' : ''} of gas saved`,
    icon: 'fuel',
  }
}

/**
 * Formats total impact with context for motivation.
 */
export function formatImpactMessage(totalKg: number, actionsCompleted: number): string {
  const equiv = kgToEquivalencies(totalKg)

  if (totalKg < 1) {
    return `You've saved ${(totalKg * 1000).toFixed(0)}g of CO₂ — that's ${equiv.phoneCharges} phone charges!`
  }

  if (totalKg < 10) {
    return `You've saved ${totalKg.toFixed(1)}kg of CO₂ — that's ${equiv.milesNotDriven} miles not driven!`
  }

  if (totalKg < 50) {
    return `You've saved ${totalKg.toFixed(1)}kg of CO₂ — like planting a tree for ${Math.round(equiv.treePlantedDays)} days!`
  }

  return `You've saved ${totalKg.toFixed(0)}kg of CO₂ — equivalent to ${Math.round(totalKg * EQUIVALENCY_FACTORS.gallonsGasoline)} gallons of gasoline!`
}

/**
 * Calculates "streak bonus" — cumulative impact multiplier for streaks.
 * Encourages continued engagement with growing numbers.
 */
export function calculateStreakImpactMultiplier(streakDays: number): number {
  if (streakDays < 7) return 1.0
  if (streakDays < 14) return 1.1
  if (streakDays < 30) return 1.2
  if (streakDays < 60) return 1.3
  return 1.5
}

/**
 * Gets comparison stats for context (US averages).
 */
export const US_AVERAGES = {
  annualFootprintKg: 16000, // ~16 tonnes per capita
  dailyFootprintKg: 43.8, // 16000 / 365
  weeklyFootprintKg: 307, // 16000 / 52
  monthlyFootprintKg: 1333, // 16000 / 12
}

/**
 * Calculates percentage reduction from US average.
 */
export function calculatePercentageReduction(savedKg: number, period: 'daily' | 'weekly' | 'monthly' | 'annual'): number {
  const baseline = {
    daily: US_AVERAGES.dailyFootprintKg,
    weekly: US_AVERAGES.weeklyFootprintKg,
    monthly: US_AVERAGES.monthlyFootprintKg,
    annual: US_AVERAGES.annualFootprintKg,
  }[period]

  return Math.round((savedKg / baseline) * 100 * 10) / 10
}
