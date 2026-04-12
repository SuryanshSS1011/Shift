import foodEmissions from '@/data/knowledge-base/food-emissions.json'
import transportEmissions from '@/data/knowledge-base/transport-emissions.json'
import homeEnergy from '@/data/knowledge-base/home-energy.json'
import shoppingWaste from '@/data/knowledge-base/shopping-waste.json'

// Type definitions for imported data
type FoodEmission = { kgCO2PerKg?: number; kgCO2PerLiter?: number }
type TransportEmission = { kgCO2PerMile: number }
type HomeEnergyItem = {
  kgCO2PerUse?: number
  kgCO2Saved?: number
  kgCO2SavedDaily?: number
  kgCO2PerLoad?: number
  costPerUse?: number
  costSaved?: number
  costSavedDaily?: number
}
type ShoppingWasteItem = {
  kgCO2PerUnit?: number
  kgCO2Saved?: number
  usesBeforeBreakeven?: number
}

// Type assertions
const food = foodEmissions as Record<string, FoodEmission>
const transport = transportEmissions as Record<string, TransportEmission>
const energy = homeEnergy as Record<string, HomeEnergyItem>
const shopping = shoppingWaste as Record<string, ShoppingWasteItem>

/**
 * Basic CO2 calculation from factor and quantity.
 */
export function computeCO2Saved(factorKgPerUnit: number, quantity: number): number {
  return factorKgPerUnit * quantity
}

/**
 * Formats CO2 amount with appropriate units.
 */
export function formatCO2(kg: number): string {
  if (kg < 0.1) {
    return `${(kg * 1000).toFixed(0)} g`
  }
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} tonnes`
  }
  return `${kg.toFixed(1)} kg`
}

/**
 * Calculates annualized savings from daily amount.
 */
export function annualizedSavings(dailyKg: number): number {
  return dailyKg * 365
}

// ============================================
// FOOD EMISSIONS
// ============================================

/**
 * Gets CO2 emission factor for a food type (kg CO2 per kg food).
 */
export function getFoodEmissionFactor(foodType: keyof typeof food): number | null {
  const emission = food[foodType]
  if (!emission) return null
  return emission.kgCO2PerKg || emission.kgCO2PerLiter || null
}

/**
 * Calculates CO2 savings from swapping one food for another.
 */
export function calculateFoodSwapSavings(
  fromFood: string,
  toFood: string,
  portionKg: number = 0.15 // ~150g portion
): number {
  const fromEmission = getFoodEmissionFactor(fromFood as keyof typeof food)
  const toEmission = getFoodEmissionFactor(toFood as keyof typeof food)

  if (fromEmission === null || toEmission === null) return 0

  return (fromEmission - toEmission) * portionKg
}

/**
 * Pre-calculated common food swaps (kg CO2 saved per swap).
 */
export const FOOD_SWAP_SAVINGS = {
  beefToChicken: calculateFoodSwapSavings('beef', 'chicken', 0.15), // ~3.0 kg
  beefToTofu: calculateFoodSwapSavings('beef', 'tofu', 0.15), // ~3.75 kg
  lambToChicken: calculateFoodSwapSavings('lamb', 'chicken', 0.15), // ~4.85 kg
  cheeseToVegetables: calculateFoodSwapSavings('cheese', 'vegetables', 0.05), // ~0.65 kg
}

// ============================================
// TRANSPORT EMISSIONS
// ============================================

/**
 * Gets CO2 emission factor for a transport mode (kg CO2 per mile).
 */
export function getTransportEmissionFactor(mode: keyof typeof transport): number | null {
  const emission = transport[mode]
  if (!emission) return null
  return emission.kgCO2PerMile
}

/**
 * Calculates CO2 savings from switching transport modes.
 */
export function calculateTransportSwapSavings(
  fromMode: string,
  toMode: string,
  distanceMiles: number
): number {
  const fromEmission = getTransportEmissionFactor(fromMode as keyof typeof transport)
  const toEmission = getTransportEmissionFactor(toMode as keyof typeof transport)

  if (fromEmission === null || toEmission === null) return 0

  return (fromEmission - toEmission) * distanceMiles
}

/**
 * Calculates daily commute emissions.
 */
export function calculateCommuteEmissions(
  mode: string,
  distanceMilesOneWay: number,
  workDaysPerWeek: number = 5
): { dailyKg: number; weeklyKg: number; annualKg: number } {
  const factor = getTransportEmissionFactor(mode as keyof typeof transport) || 0.404 // default to car
  const dailyKg = factor * distanceMilesOneWay * 2 // round trip
  const weeklyKg = dailyKg * workDaysPerWeek
  const annualKg = weeklyKg * 50 // 50 work weeks

  return { dailyKg, weeklyKg, annualKg }
}

/**
 * Common transport mode switching savings.
 */
export const TRANSPORT_MODE_FACTORS = {
  carToSubway: (miles: number) => calculateTransportSwapSavings('car_average', 'subway_nyc', miles),
  carToBus: (miles: number) => calculateTransportSwapSavings('car_average', 'bus_us_average', miles),
  carToBike: (miles: number) => calculateTransportSwapSavings('car_average', 'bicycle', miles),
  rideshareToSubway: (miles: number) => calculateTransportSwapSavings('rideshare_uber', 'subway_nyc', miles),
}

// ============================================
// HOME ENERGY EMISSIONS
// ============================================

/**
 * Gets energy savings data for a specific action.
 */
export function getEnergySavings(action: keyof typeof energy): HomeEnergyItem | null {
  return energy[action] || null
}

/**
 * Pre-calculated home energy savings (kg CO2 per occurrence).
 */
export const HOME_ENERGY_SAVINGS = {
  airDryLaundry: energy.dryer_load?.kgCO2PerUse || 0.69,
  coldWash: energy.cold_wash_vs_hot?.kgCO2Saved || 0.44,
  unplugDevices: energy.unplug_devices_daily?.kgCO2Saved || 0.15,
  lowerThermostat2F: energy.thermostat_2f_lower?.kgCO2SavedDaily || 0.23,
  useLED: energy.led_vs_incandescent_hour?.kgCO2Saved || 0.04,
  fullDishwasher: energy.dishwasher_full_load?.kgCO2PerLoad || 0.45,
  microwaveInsteadOfOven: energy.microwave_vs_oven?.kgCO2Saved || 0.12,
}

// ============================================
// SHOPPING & WASTE EMISSIONS
// ============================================

/**
 * Gets emissions data for shopping/waste items.
 */
export function getShoppingWasteData(item: keyof typeof shopping): ShoppingWasteItem | null {
  return shopping[item] || null
}

/**
 * Pre-calculated shopping & waste savings.
 */
export const SHOPPING_WASTE_SAVINGS = {
  skipPlasticBag: shopping.plastic_bag?.kgCO2PerUnit || 0.033,
  buySecondhand: shopping.secondhand_vs_new?.kgCO2Saved || 8.5,
  repairElectronics: shopping.repair_vs_replace_electronics?.kgCO2Saved || 50.0,
  compostPerKg: shopping.composting_food_waste_kg?.kgCO2Saved || 0.25,
  recycleAluminumCan: shopping.recycling_aluminum_can?.kgCO2Saved || 0.14,
  skipPaperReceipt: shopping.paper_receipt?.kgCO2PerUnit || 0.0017,
}

// ============================================
// ANNUAL FOOTPRINT ESTIMATION
// ============================================

/**
 * Estimates annual carbon footprint based on user profile.
 * Uses US average as baseline (~16,000 kg CO2/year per capita).
 */
export function estimateAnnualFootprint(profile: {
  commuteType: string
  commuteDistanceMiles: number | null
  dietPattern: string
  livingSituation: string
}): number {
  // US average baseline
  let footprint = 16000

  // Adjust for commute
  const commuteDistance = profile.commuteDistanceMiles || 15 // default 15 miles
  switch (profile.commuteType) {
    case 'drive':
      footprint += calculateCommuteEmissions('car_average', commuteDistance).annualKg - 3000
      break
    case 'transit':
      footprint -= 1500 // Less than average
      break
    case 'bike_walk':
      footprint -= 2500 // Much less than average
      break
    case 'wfh':
      footprint -= 2000 // No commute
      break
    case 'mixed':
      footprint -= 500 // Slightly less
      break
  }

  // Adjust for diet
  switch (profile.dietPattern) {
    case 'meat_most_days':
      footprint += 500 // Above average
      break
    case 'chicken_fish':
      footprint -= 300 // Below average
      break
    case 'mostly_plant':
      footprint -= 800 // Well below average
      break
    case 'vegan_vegetarian':
      footprint -= 1200 // Much below average
      break
  }

  // Adjust for living situation (home energy use)
  switch (profile.livingSituation) {
    case 'city_apartment':
      footprint -= 1000 // Smaller, shared walls
      break
    case 'urban_house':
      footprint += 500 // Larger space
      break
    case 'suburbs':
      footprint += 1000 // Larger home, more driving
      break
    case 'rural':
      footprint += 800 // Larger property but may be efficient
      break
  }

  return Math.max(5000, Math.min(25000, footprint)) // Clamp to reasonable range
}
