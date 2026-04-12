import { getCached, redis } from './redis'
import type { ForecastDataPoint, GridForecast, IntensityLevel } from '@/types/grid'

export interface GridIntensity {
  zone: string
  carbonIntensity: number
  renewablePercent: number
  fossilFuelPercent: number
}

// Zone lookup by approximate lat/lng bounding boxes
const ZONE_MAP: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  'US-NY-NYIS': { minLat: 40.4, maxLat: 45.0, minLng: -79.8, maxLng: -71.8 },
  'US-CAL-CISO': { minLat: 32.5, maxLat: 42.0, minLng: -124.5, maxLng: -114.0 },
  'US-TEX-ERCO': { minLat: 25.8, maxLat: 36.5, minLng: -106.6, maxLng: -93.5 },
  'US-MIDA-PJM': { minLat: 36.5, maxLat: 42.5, minLng: -84.8, maxLng: -74.0 },
}

export function getZoneFromCoordinates(lat: number, lng: number): string {
  for (const [zone, bounds] of Object.entries(ZONE_MAP)) {
    if (lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng) {
      return zone
    }
  }
  return 'US-NY-NYIS' // Default fallback
}

async function fetchGridIntensity(lat: number, lng: number): Promise<GridIntensity> {
  const zone = getZoneFromCoordinates(lat, lng)
  const response = await fetch(
    `https://api.electricitymap.org/v3/carbon-intensity/latest?zone=${zone}`,
    {
      headers: {
        'auth-token': process.env.ELECTRICITY_MAPS_API_KEY!,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Electricity Maps API error: ${response.status}`)
  }

  const data = await response.json()

  return {
    zone,
    carbonIntensity: data.carbonIntensity,
    renewablePercent: data.renewablePercentage || 0,
    fossilFuelPercent: data.fossilFuelPercentage || 100,
  }
}

// 1-hour TTL cache
export async function getGridIntensity(lat: number, lng: number): Promise<GridIntensity> {
  const cacheKey = `grid:${lat.toFixed(2)}:${lng.toFixed(2)}`
  return getCached(cacheKey, () => fetchGridIntensity(lat, lng), 3600)
}

// ============================================
// FORECAST FUNCTIONS
// ============================================

const FORECAST_FALLBACK_CACHE_KEY = 'forecast-fallback-mode'
const FORECAST_FALLBACK_TTL = 86400 // 24 hours

/**
 * Generate time-based heuristic forecast when API is unavailable
 * Solar peak (10 AM - 3 PM) = green, evening peak (5-9 PM) = red
 */
function generateHeuristicForecast(): ForecastDataPoint[] {
  const now = new Date()
  const forecast: ForecastDataPoint[] = []

  for (let i = 0; i < 24; i++) {
    const hour = (now.getHours() + i) % 24
    const datetime = new Date(now)
    datetime.setHours(hour, 0, 0, 0)
    if (i > 0 && hour < now.getHours()) {
      datetime.setDate(datetime.getDate() + 1)
    }

    // Time-based heuristics
    let carbonIntensity: number
    if (hour >= 10 && hour <= 15) {
      // Solar peak: green (150-220)
      carbonIntensity = 150 + Math.random() * 70
    } else if (hour >= 6 && hour < 10) {
      // Morning ramp: yellow (220-300)
      carbonIntensity = 220 + Math.random() * 80
    } else if (hour > 15 && hour < 17) {
      // Afternoon: yellow (220-280)
      carbonIntensity = 220 + Math.random() * 60
    } else if (hour >= 17 && hour <= 21) {
      // Evening peak: red (350-450)
      carbonIntensity = 350 + Math.random() * 100
    } else {
      // Night: moderate (250-320)
      carbonIntensity = 250 + Math.random() * 70
    }

    forecast.push({
      datetime: datetime.toISOString(),
      carbonIntensity: Math.round(carbonIntensity),
    })
  }

  return forecast
}

/**
 * Find the next green time window (carbon intensity < 200)
 * Returns the next closest green hour(s) as a contiguous range
 */
export function findNextGreenWindow(
  forecast: ForecastDataPoint[]
): { startHour: number; endHour: number; avgIntensity: number } {
  if (forecast.length === 0) {
    return { startHour: 10, endHour: 12, avgIntensity: 180 }
  }

  const GREEN_THRESHOLD = 200

  // Find all green hours
  const greenIndices: number[] = []
  for (let i = 0; i < forecast.length; i++) {
    if (forecast[i].carbonIntensity < GREEN_THRESHOLD) {
      greenIndices.push(i)
    }
  }

  // If no green hours, find the lowest intensity hour
  if (greenIndices.length === 0) {
    let minIndex = 0
    let minIntensity = Infinity
    for (let i = 0; i < forecast.length; i++) {
      if (forecast[i].carbonIntensity < minIntensity) {
        minIntensity = forecast[i].carbonIntensity
        minIndex = i
      }
    }
    const hour = new Date(forecast[minIndex].datetime).getHours()
    return {
      startHour: hour,
      endHour: (hour + 1) % 24,
      avgIntensity: Math.round(minIntensity),
    }
  }

  // Find contiguous ranges of green hours starting from the first (next closest)
  const firstGreenIndex = greenIndices[0]
  let endIndex = firstGreenIndex

  // Extend to include contiguous green hours
  for (let i = 1; i < greenIndices.length; i++) {
    if (greenIndices[i] === greenIndices[i - 1] + 1) {
      endIndex = greenIndices[i]
    } else {
      break // Stop at first gap
    }
  }

  // Calculate average intensity for the green window
  let totalIntensity = 0
  for (let i = firstGreenIndex; i <= endIndex; i++) {
    totalIntensity += forecast[i].carbonIntensity
  }
  const avgIntensity = totalIntensity / (endIndex - firstGreenIndex + 1)

  const startHour = new Date(forecast[firstGreenIndex].datetime).getHours()
  const endHour = (new Date(forecast[endIndex].datetime).getHours() + 1) % 24

  return {
    startHour,
    endHour,
    avgIntensity: Math.round(avgIntensity),
  }
}

// Keep the old function for backwards compatibility with batch-scheduler
export function findOptimalWindow(
  forecast: ForecastDataPoint[],
  windowSizeHours: number = 2
): { startHour: number; endHour: number; avgIntensity: number } {
  return findNextGreenWindow(forecast)
}

/**
 * Find the worst N-hour window with highest average carbon intensity
 */
function findWorstWindow(
  forecast: ForecastDataPoint[],
  windowSizeHours: number = 2
): { startHour: number; endHour: number; avgIntensity: number } {
  if (forecast.length < windowSizeHours) {
    return { startHour: 18, endHour: 20, avgIntensity: 380 }
  }

  let worstStart = 0
  let worstAvg = -Infinity

  for (let i = 0; i <= forecast.length - windowSizeHours; i++) {
    const windowSlice = forecast.slice(i, i + windowSizeHours)
    const avg = windowSlice.reduce((sum, p) => sum + p.carbonIntensity, 0) / windowSizeHours

    if (avg > worstAvg) {
      worstAvg = avg
      worstStart = i
    }
  }

  const startDate = new Date(forecast[worstStart].datetime)
  const endDate = new Date(forecast[Math.min(worstStart + windowSizeHours - 1, forecast.length - 1)].datetime)

  return {
    startHour: startDate.getHours(),
    endHour: (endDate.getHours() + 1) % 24,
    avgIntensity: Math.round(worstAvg),
  }
}

/**
 * Fetch forecast from Electricity Maps API
 * Falls back to heuristic forecast if API returns 401/403 (paid tier required)
 */
async function fetchGridForecast(lat: number, lng: number): Promise<GridForecast> {
  const zone = getZoneFromCoordinates(lat, lng)

  // Check if we're in fallback mode (cached for 24h after API failure)
  const inFallbackMode = await redis.get(FORECAST_FALLBACK_CACHE_KEY)

  if (inFallbackMode) {
    console.log('[electricity-maps] Using heuristic forecast (fallback mode)')
    return buildForecastFromHeuristics(zone)
  }

  try {
    const response = await fetch(
      `https://api.electricitymap.org/v3/carbon-intensity/forecast?zone=${zone}`,
      {
        headers: {
          'auth-token': process.env.ELECTRICITY_MAPS_API_KEY!,
        },
      }
    )

    if (response.status === 401 || response.status === 403) {
      // Paid tier required - cache this fact and fall back
      console.log('[electricity-maps] Forecast endpoint requires paid tier, using heuristics')
      await redis.setex(FORECAST_FALLBACK_CACHE_KEY, FORECAST_FALLBACK_TTL, 'true')
      return buildForecastFromHeuristics(zone)
    }

    if (!response.ok) {
      throw new Error(`Electricity Maps API error: ${response.status}`)
    }

    const data = await response.json()

    // API returns { zone, forecast: [{ datetime, carbonIntensity }] }
    const forecast: ForecastDataPoint[] = (data.forecast || []).slice(0, 24).map((point: { datetime: string; carbonIntensity: number }) => ({
      datetime: point.datetime,
      carbonIntensity: point.carbonIntensity,
    }))

    if (forecast.length === 0) {
      return buildForecastFromHeuristics(zone)
    }

    const bestWindow = findNextGreenWindow(forecast)
    const worstWindow = findWorstWindow(forecast, 2)

    return {
      zone,
      forecast,
      updatedAt: new Date().toISOString(),
      bestWindow,
      worstWindow,
    }
  } catch (error) {
    console.error('[electricity-maps] Forecast fetch error:', error)
    return buildForecastFromHeuristics(zone)
  }
}

function buildForecastFromHeuristics(zone: string): GridForecast {
  const forecast = generateHeuristicForecast()
  const bestWindow = findNextGreenWindow(forecast)
  const worstWindow = findWorstWindow(forecast, 2)

  return {
    zone,
    forecast,
    updatedAt: new Date().toISOString(),
    bestWindow,
    worstWindow,
  }
}

/**
 * Get grid forecast with 1-hour caching
 */
export async function getGridForecast(lat: number, lng: number): Promise<GridForecast> {
  const cacheKey = `grid-forecast:${lat.toFixed(2)}:${lng.toFixed(2)}`
  return getCached(cacheKey, () => fetchGridForecast(lat, lng), 3600)
}

/**
 * Get intensity level based on carbon intensity
 */
export function getIntensityLevel(carbonIntensity: number): IntensityLevel {
  if (carbonIntensity < 200) return 'low'
  if (carbonIntensity < 400) return 'moderate'
  return 'high'
}

/**
 * Format hour range as human-readable string (e.g., "2-4 PM")
 */
export function formatHourRange(startHour: number, endHour: number): string {
  const formatHour = (hour: number): string => {
    if (hour === 0 || hour === 24) return '12 AM'
    if (hour === 12) return '12 PM'
    if (hour < 12) return `${hour} AM`
    return `${hour - 12} PM`
  }

  return `${formatHour(startHour)}-${formatHour(endHour)}`
}

/**
 * Check if current grid intensity is in the "green" range (bottom 25% of today's forecast)
 */
export function isCurrentlyGreenGrid(forecast: GridForecast): boolean {
  if (forecast.forecast.length === 0) return false

  const sortedIntensities = [...forecast.forecast]
    .map(p => p.carbonIntensity)
    .sort((a, b) => a - b)

  const percentile25Index = Math.floor(sortedIntensities.length * 0.25)
  const threshold = sortedIntensities[percentile25Index]

  // Get current intensity (first forecast point should be closest to now)
  const currentIntensity = forecast.forecast[0]?.carbonIntensity || 280

  return currentIntensity <= threshold
}
