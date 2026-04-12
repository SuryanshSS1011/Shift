import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { supabase } from '@/lib/supabase'
import {
  getGridForecast,
  getIntensityLevel,
  formatHourRange,
} from '@/lib/electricity-maps'
import type { GridForecastResponse } from '@/types/grid'

const InputSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
})

// Fallback forecast data for error cases
function getFallbackForecast(): GridForecastResponse {
  const now = new Date()
  const forecast = []

  for (let i = 0; i < 24; i++) {
    const datetime = new Date(now)
    datetime.setHours(now.getHours() + i, 0, 0, 0)
    forecast.push({
      datetime: datetime.toISOString(),
      carbonIntensity: 280 + Math.sin(((now.getHours() + i) / 24) * Math.PI * 2) * 80,
    })
  }

  return {
    zone: 'US-NY-NYIS',
    forecast: forecast.map(f => ({
      datetime: f.datetime,
      carbonIntensity: Math.round(f.carbonIntensity),
    })),
    bestTime: {
      label: '10 AM-12 PM',
      startHour: 10,
      endHour: 12,
      intensity: 200,
      level: 'low',
    },
    currentIntensity: 280,
    currentLevel: 'moderate',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = InputSchema.parse(body)

    // Get user with lat/lng
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('lat, lng')
      .eq('session_id', sessionId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If no coordinates, return fallback data
    if (!user.lat || !user.lng) {
      return NextResponse.json({
        success: true,
        data: getFallbackForecast(),
      })
    }

    // Fetch grid forecast (cached)
    const forecastData = await getGridForecast(user.lat, user.lng)

    // Get current intensity (first point in forecast)
    const currentIntensity = forecastData.forecast[0]?.carbonIntensity || 280

    // Build response
    const response: GridForecastResponse = {
      zone: forecastData.zone,
      forecast: forecastData.forecast,
      bestTime: {
        label: formatHourRange(forecastData.bestWindow.startHour, forecastData.bestWindow.endHour),
        startHour: forecastData.bestWindow.startHour,
        endHour: forecastData.bestWindow.endHour,
        intensity: forecastData.bestWindow.avgIntensity,
        level: forecastData.bestWindow.level || 'low',
      },
      currentIntensity,
      currentLevel: getIntensityLevel(currentIntensity),
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('[grid-forecast] Error:', error)

    // Return fallback data on error (never 500 for this endpoint)
    return NextResponse.json({
      success: true,
      data: getFallbackForecast(),
    })
  }
}
