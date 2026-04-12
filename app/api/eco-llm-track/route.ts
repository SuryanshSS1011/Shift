import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { z } from 'zod'

const TrackEventSchema = z.object({
  event: z.enum(['cache_hit', 'cache_miss', 'prompt_saved']),
  energyWh: z.number().optional(),
  co2Grams: z.number().optional(),
  waterMl: z.number().optional(),
})

// Redis keys for tracking
const KEYS = {
  cacheHits: 'eco-llm:cache-hits',
  cacheMisses: 'eco-llm:cache-misses',
  promptsSaved: 'eco-llm:prompts-saved',
  totalEnergySaved: 'eco-llm:total-energy-wh',
  totalCo2Saved: 'eco-llm:total-co2-grams',
  totalWaterSaved: 'eco-llm:total-water-ml',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, energyWh, co2Grams, waterMl } = TrackEventSchema.parse(body)

    // Increment appropriate counters
    if (event === 'cache_hit') {
      await redis.incr(KEYS.cacheHits)
      // Add environmental savings for cache hit (avoided LLM call)
      if (energyWh) await redis.incrbyfloat(KEYS.totalEnergySaved, energyWh)
      if (co2Grams) await redis.incrbyfloat(KEYS.totalCo2Saved, co2Grams)
      if (waterMl) await redis.incrbyfloat(KEYS.totalWaterSaved, waterMl)
    } else if (event === 'cache_miss') {
      await redis.incr(KEYS.cacheMisses)
    } else if (event === 'prompt_saved') {
      await redis.incr(KEYS.promptsSaved)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error('[eco-llm-track] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET endpoint to retrieve current stats
export async function GET() {
  try {
    const [cacheHits, cacheMisses, promptsSaved, energySaved, co2Saved, waterSaved] =
      await Promise.all([
        redis.get(KEYS.cacheHits),
        redis.get(KEYS.cacheMisses),
        redis.get(KEYS.promptsSaved),
        redis.get(KEYS.totalEnergySaved),
        redis.get(KEYS.totalCo2Saved),
        redis.get(KEYS.totalWaterSaved),
      ])

    const hits = Number(cacheHits) || 0
    const misses = Number(cacheMisses) || 0
    const total = hits + misses

    return NextResponse.json({
      success: true,
      data: {
        cacheHits: hits,
        cacheMisses: misses,
        promptsSaved: Number(promptsSaved) || 0,
        cacheHitRate: total > 0 ? hits / total : 0,
        totalEnergySavedWh: Number(energySaved) || 0,
        totalCo2SavedGrams: Number(co2Saved) || 0,
        totalWaterSavedMl: Number(waterSaved) || 0,
      },
    })
  } catch (error) {
    console.error('[eco-llm-track] GET Error:', error)
    return NextResponse.json({
      success: true,
      data: {
        cacheHits: 0,
        cacheMisses: 0,
        promptsSaved: 0,
        cacheHitRate: 0,
        totalEnergySavedWh: 0,
        totalCo2SavedGrams: 0,
        totalWaterSavedMl: 0,
      },
    })
  }
}
