/**
 * Carbon Estimation for LLM Inference
 *
 * EcoLogits TypeScript reimplementation for estimating the environmental
 * cost of LLM API calls. Used by:
 * - Server-side `/api/eco-llm-track` route
 * - `/api/generate-action` for tracking AI cost per action
 * - Chrome extension (copied inline, no module imports in extensions)
 */

// Model coefficients from EcoLogits research
const ALPHA = 8.91e-5 // Wh per output token per billion active params
const BETA = 1.43e-3 // Wh per output token baseline
const PUE = 1.2 // Power Usage Effectiveness for data centers

// Groq uses custom LPU chips which are more efficient than A100 GPUs
const GROQ_LPU_MULTIPLIER = 0.3

// Grid carbon intensity (gCO2/kWh)
// Groq's data center is in Spokane, WA (US-NW-PACW grid)
const SPOKANE_GRID_GCO2_PER_KWH = 273
// World average for other providers
const WORLD_AVG_GCO2_PER_KWH = 490

// Model parameter sizes (billions)
const MODEL_PARAMS: Record<string, { active: number; total: number }> = {
  'llama-3.3-70b-versatile': { active: 70, total: 70 },
  'llama-3.1-8b-instant': { active: 8, total: 8 },
  'gemini-2.0-flash-lite': { active: 8, total: 8 },
  'gemini-2.5-flash': { active: 8, total: 8 },
  // Fallback defaults
  default: { active: 70, total: 70 },
}

export interface CarbonEstimate {
  energyWh: number
  co2Grams: number
  waterMl: number
}

/**
 * Estimate the carbon footprint of an LLM inference call
 *
 * @param model - Model identifier (e.g., 'llama-3.3-70b-versatile')
 * @param outputTokens - Number of output tokens generated
 * @param inputTokens - Optional: number of input tokens (adds small overhead)
 * @returns Carbon estimate with energy, CO2, and water usage
 */
export function estimateCarbon(
  model: string,
  outputTokens: number,
  inputTokens: number = 0
): CarbonEstimate {
  const params = MODEL_PARAMS[model] ?? MODEL_PARAMS.default

  // Calculate energy per token
  const gpuEnergyPerToken = ALPHA * params.active + BETA

  // Estimate GPU count needed for model
  // Each A100 has 80GB, model needs ~2 bytes per param + 20% overhead
  const gpusRequired = Math.ceil((params.total * 2 * 1.2) / 80)

  // Input tokens use less energy (just forward pass, no generation)
  const inputEnergyFactor = 0.1
  const effectiveTokens = outputTokens + inputTokens * inputEnergyFactor

  // Total energy with PUE overhead
  let totalEnergyWh = gpuEnergyPerToken * effectiveTokens * gpusRequired * PUE

  // Apply LPU efficiency for Groq models
  const isGroqModel = model.startsWith('llama')
  if (isGroqModel) {
    totalEnergyWh *= GROQ_LPU_MULTIPLIER
  }

  // Determine grid intensity based on provider
  const gridIntensity = isGroqModel
    ? SPOKANE_GRID_GCO2_PER_KWH
    : WORLD_AVG_GCO2_PER_KWH

  // Calculate CO2 (convert Wh to kWh)
  const co2Grams = (totalEnergyWh / 1000) * gridIntensity

  // Water usage estimate
  // Groq uses air-cooled LPU racks, scope-1 water is approximately 0
  // Other data centers use evaporative cooling
  const waterMl = isGroqModel ? 0 : totalEnergyWh * 0.5

  return {
    energyWh: totalEnergyWh,
    co2Grams,
    waterMl,
  }
}

/**
 * Calculate the carbon ROI ratio
 * How much CO2 is saved by the action vs the AI cost to generate it
 *
 * @param co2SavingsKg - CO2 saved by the action in kg
 * @param aiCostCo2Grams - AI inference cost in grams
 * @returns ROI ratio (rounded to nearest 10) or display string
 */
export function calculateCarbonROI(
  co2SavingsKg: number,
  aiCostCo2Grams: number
): { ratio: number; displayText: string } {
  if (aiCostCo2Grams <= 0) {
    return { ratio: Infinity, displayText: '∞×' }
  }

  // Convert kg to grams for comparison
  const co2SavingsGrams = co2SavingsKg * 1000

  // Calculate ratio and round to nearest 10
  const rawRatio = co2SavingsGrams / aiCostCo2Grams
  const ratio = Math.round(rawRatio / 10) * 10

  // Format display text
  let displayText: string
  if (ratio > 10000) {
    displayText = '10,000×+'
  } else if (ratio >= 1000) {
    displayText = `${(ratio / 1000).toFixed(1)}k×`
  } else {
    displayText = `${ratio.toLocaleString()}×`
  }

  return { ratio, displayText }
}

/**
 * Format carbon cost for display
 */
export function formatCarbonCost(co2Grams: number): string {
  if (co2Grams < 0.01) {
    return '<0.01 gCO₂'
  }
  if (co2Grams < 1) {
    return `${co2Grams.toFixed(2)} gCO₂`
  }
  return `${co2Grams.toFixed(1)} gCO₂`
}
