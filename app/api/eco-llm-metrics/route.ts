import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats } from '@/lib/upstash-vector'
import { redis } from '@/lib/redis'

export interface EcoLLMMetrics {
  totalPromptsCached: number
  cacheHits: number
  cacheMisses: number
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

// Redis keys for tracking (same as eco-llm-track)
const KEYS = {
  cacheHits: 'eco-llm:cache-hits',
  cacheMisses: 'eco-llm:cache-misses',
  totalEnergySaved: 'eco-llm:total-energy-wh',
  totalCo2Saved: 'eco-llm:total-co2-grams',
  totalWaterSaved: 'eco-llm:total-water-ml',
}

export async function GET(request: NextRequest) {
  try {
    // Get vector DB stats and Redis tracking data in parallel
    const [vectorStats, cacheHits, cacheMisses, energySaved, co2Saved, waterSaved] =
      await Promise.all([
        getCacheStats().catch(() => ({ totalVectors: 0, dimension: 0, pendingVectorCount: 0 })),
        redis.get(KEYS.cacheHits),
        redis.get(KEYS.cacheMisses),
        redis.get(KEYS.totalEnergySaved),
        redis.get(KEYS.totalCo2Saved),
        redis.get(KEYS.totalWaterSaved),
      ])

    const hits = Number(cacheHits) || 0
    const misses = Number(cacheMisses) || 0
    const total = hits + misses

    const energyWh = Number(energySaved) || 0
    const co2Grams = Number(co2Saved) || 0
    const waterMl = Number(waterSaved) || 0

    // Calculate equivalencies
    const equivalencies = {
      // 1 smartphone charge ≈ 10 Wh
      smartphoneCharges: Math.round(energyWh / 10 * 10) / 10,
      // 1 LED bulb hour ≈ 10 Wh
      ledBulbHours: Math.round(energyWh / 10 * 10) / 10,
      // 1g CO2 ≈ driving 4 meters in avg car
      drivingMeters: Math.round(co2Grams * 4),
    }

    const metrics: EcoLLMMetrics = {
      totalPromptsCached: vectorStats.totalVectors,
      cacheHits: hits,
      cacheMisses: misses,
      cacheHitRate: total > 0 ? Math.round((hits / total) * 100) / 100 : 0,
      energySavedWh: Math.round(energyWh * 100) / 100,
      co2SavedGrams: Math.round(co2Grams * 100) / 100,
      waterSavedMl: Math.round(waterMl * 100) / 100,
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
        cacheHits: 0,
        cacheMisses: 0,
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
