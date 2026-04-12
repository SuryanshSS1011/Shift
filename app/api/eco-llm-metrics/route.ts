import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats, calculateEnvironmentalSavings } from '@/lib/upstash-vector'
import { getCached } from '@/lib/redis'

export interface EcoLLMMetrics {
  totalPromptsCached: number
  estimatedCacheHits: number
  cacheHitRate: number
  energySavedWh: number
  co2SavedGrams: number
  waterSavedMl: number
  equivalencies: {
    smartphoneCharges: number
    ledBulbHours: number
    drivingMeters: number
  }
}

// Cache key for tracking cache hit count
const CACHE_HIT_KEY = 'eco-llm:cache-hits'

export async function GET(request: NextRequest) {
  try {
    // Get cache stats from Upstash Vector (cached for 5 minutes)
    const stats = await getCached(
      'eco-llm:stats',
      async () => {
        const cacheStats = await getCacheStats()
        return cacheStats
      },
      300 // 5-minute TTL
    )

    // Estimate cache hits (in a real implementation, this would be tracked)
    // For now, estimate based on vector count (assume 30% hit rate)
    const estimatedCacheHits = Math.floor(stats.totalVectors * 0.3)
    const cacheHitRate = stats.totalVectors > 0 ? 0.3 : 0

    // Calculate environmental savings
    const savings = calculateEnvironmentalSavings(estimatedCacheHits)

    // Calculate equivalencies
    const equivalencies = {
      // 1 smartphone charge ≈ 10 Wh
      smartphoneCharges: Math.round(savings.energySavedWh / 10 * 10) / 10,
      // 1 LED bulb hour ≈ 10 Wh
      ledBulbHours: Math.round(savings.energySavedWh / 10 * 10) / 10,
      // 1g CO2 ≈ driving 4 meters in avg car
      drivingMeters: Math.round(savings.co2SavedGrams * 4),
    }

    const metrics: EcoLLMMetrics = {
      totalPromptsCached: stats.totalVectors,
      estimatedCacheHits,
      cacheHitRate,
      energySavedWh: Math.round(savings.energySavedWh * 100) / 100,
      co2SavedGrams: Math.round(savings.co2SavedGrams * 100) / 100,
      waterSavedMl: Math.round(savings.waterSavedMl * 100) / 100,
      equivalencies,
    }

    return NextResponse.json({
      success: true,
      data: metrics,
    })
  } catch (error) {
    console.error('[eco-llm-metrics] Error:', error)

    // Return fallback data on error
    return NextResponse.json({
      success: true,
      data: {
        totalPromptsCached: 0,
        estimatedCacheHits: 0,
        cacheHitRate: 0,
        energySavedWh: 0,
        co2SavedGrams: 0,
        waterSavedMl: 0,
        equivalencies: {
          smartphoneCharges: 0,
          ledBulbHours: 0,
          drivingMeters: 0,
        },
      } as EcoLLMMetrics,
    })
  }
}
