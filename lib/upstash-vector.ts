import { Index } from '@upstash/vector'

// Singleton Upstash Vector client
export const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_URL!,
  token: process.env.UPSTASH_VECTOR_TOKEN!,
})

export interface CacheStats {
  totalVectors: number
  dimension: number
  pendingVectorCount: number
}

export interface CachedPrompt {
  id: string
  prompt: string
  response: string
  score?: number
}

/**
 * Get cache statistics from the vector database
 */
export async function getCacheStats(): Promise<CacheStats> {
  const info = await vectorIndex.info()
  return {
    totalVectors: info.vectorCount,
    dimension: info.dimension,
    pendingVectorCount: info.pendingVectorCount,
  }
}

/**
 * Query for similar prompts in the cache
 * @param prompt The prompt to search for
 * @param threshold Minimum similarity score (0.0-1.0), default 0.9
 * @returns The cached response if found, null otherwise
 */
export async function querySimilar(
  prompt: string,
  threshold = 0.9
): Promise<string | null> {
  const results = await vectorIndex.query({
    data: prompt,
    topK: 1,
    includeMetadata: true,
  })

  if (results.length > 0 && results[0].score > threshold) {
    return (results[0].metadata?.value as string) || null
  }
  return null
}

/**
 * Fetch recent cached prompts for display
 * Note: Upstash Vector doesn't support listing all vectors directly,
 * so we use a range query approach if IDs are known
 */
export async function getRecentCachedPrompts(
  limit = 10
): Promise<CachedPrompt[]> {
  // Since Upstash Vector doesn't have a "list all" feature,
  // we would need to track IDs separately (e.g., in Redis)
  // For now, return empty array - this would be enhanced with Redis tracking
  return []
}

/**
 * Calculate estimated environmental savings from cache hits
 * Based on EcoLogits data for Gemini models
 */
export function calculateEnvironmentalSavings(cacheHits: number): {
  energySavedWh: number
  co2SavedGrams: number
  waterSavedMl: number
} {
  // Average values from EcoLogits for a typical Gemini query
  // These are conservative estimates
  const avgEnergyPerQueryWh = 0.5 // Wh per query
  const avgCo2PerQueryGrams = 0.3 // grams CO2e per query
  const avgWaterPerQueryMl = 1.5 // mL water per query

  return {
    energySavedWh: cacheHits * avgEnergyPerQueryWh,
    co2SavedGrams: cacheHits * avgCo2PerQueryGrams,
    waterSavedMl: cacheHits * avgWaterPerQueryMl,
  }
}
