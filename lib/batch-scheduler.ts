import { getGridForecast, findOptimalWindow, isCurrentlyGreenGrid } from './electricity-maps'
import { getCached } from './redis'
import { supabase } from './supabase'
import type { BatchScheduleResult } from '@/types/grid'

/**
 * Get batch schedule recommendation for coordinates
 * Determines if now is a good time to run batch jobs
 */
async function fetchBatchSchedule(lat: number, lng: number): Promise<BatchScheduleResult> {
  const forecast = await getGridForecast(lat, lng)

  const currentIntensity = forecast.forecast[0]?.carbonIntensity || 280
  const isGreen = isCurrentlyGreenGrid(forecast)

  // Calculate current percentile (0 = greenest, 100 = dirtiest)
  const sortedIntensities = [...forecast.forecast]
    .map(p => p.carbonIntensity)
    .sort((a, b) => a - b)

  const currentIndex = sortedIntensities.findIndex(i => i >= currentIntensity)
  const currentPercentile = Math.round((currentIndex / sortedIntensities.length) * 100)

  // Find next green window if not currently green
  let nextGreenWindow: Date | null = null
  if (!isGreen) {
    const bestWindow = findOptimalWindow(forecast.forecast, 2)
    const now = new Date()
    nextGreenWindow = new Date(now)
    nextGreenWindow.setHours(bestWindow.startHour, 0, 0, 0)

    // If best window start is before current hour, it's tomorrow
    if (bestWindow.startHour <= now.getHours()) {
      nextGreenWindow.setDate(nextGreenWindow.getDate() + 1)
    }
  }

  return {
    shouldRunNow: isGreen,
    nextGreenWindow,
    currentIntensity,
    currentPercentile,
  }
}

/**
 * Look up user coordinates from database by session ID
 */
async function getUserCoordinates(sessionId: string): Promise<{ lat: number; lng: number } | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('lat, lng')
    .eq('session_id', sessionId)
    .single()

  if (error || !user || !user.lat || !user.lng) {
    return null
  }

  return { lat: user.lat, lng: user.lng }
}

/**
 * Check if batch jobs should run now based on grid intensity
 * Returns true if current intensity is in the bottom 25% of today's forecast
 */
export async function shouldRunBatchNow(lat: number, lng: number): Promise<boolean> {
  const cacheKey = `batch-schedule:${lat.toFixed(2)}:${lng.toFixed(2)}`
  const schedule = await getCached(cacheKey, () => fetchBatchSchedule(lat, lng), 1800)
  return schedule.shouldRunNow
}

/**
 * Check if batch jobs should run now for a specific user (by session ID)
 * Looks up user coordinates from database
 */
export async function shouldRunBatchNowForUser(sessionId: string): Promise<boolean> {
  const coords = await getUserCoordinates(sessionId)
  if (!coords) {
    console.log('[batch-scheduler] No coordinates found for user, defaulting to run now')
    return true // If we can't determine location, don't block execution
  }
  return shouldRunBatchNow(coords.lat, coords.lng)
}

/**
 * Get the next green window for batch jobs
 * Returns a Date when the grid is expected to be clean
 */
export async function getNextGreenWindow(
  lat: number,
  lng: number,
  minHoursFromNow: number = 0
): Promise<Date | null> {
  const cacheKey = `batch-schedule:${lat.toFixed(2)}:${lng.toFixed(2)}`
  const schedule = await getCached(cacheKey, () => fetchBatchSchedule(lat, lng), 1800)

  if (schedule.shouldRunNow && minHoursFromNow === 0) {
    return new Date() // Can run now
  }

  if (!schedule.nextGreenWindow) {
    return null
  }

  const minTime = new Date()
  minTime.setHours(minTime.getHours() + minHoursFromNow)

  if (schedule.nextGreenWindow > minTime) {
    return schedule.nextGreenWindow
  }

  // Next green window is before min time, need to wait
  return minTime
}

/**
 * Get the next green window for a specific user (by session ID)
 */
export async function getNextGreenWindowForUser(
  sessionId: string,
  minHoursFromNow: number = 0
): Promise<Date | null> {
  const coords = await getUserCoordinates(sessionId)
  if (!coords) {
    return new Date() // If we can't determine location, allow immediate execution
  }
  return getNextGreenWindow(coords.lat, coords.lng, minHoursFromNow)
}

/**
 * Get full batch schedule information
 */
export async function getBatchSchedule(lat: number, lng: number): Promise<BatchScheduleResult> {
  const cacheKey = `batch-schedule:${lat.toFixed(2)}:${lng.toFixed(2)}`
  return getCached(cacheKey, () => fetchBatchSchedule(lat, lng), 1800)
}

/**
 * Get full batch schedule for a specific user (by session ID)
 */
export async function getBatchScheduleForUser(sessionId: string): Promise<BatchScheduleResult | null> {
  const coords = await getUserCoordinates(sessionId)
  if (!coords) {
    return null
  }
  return getBatchSchedule(coords.lat, coords.lng)
}

/**
 * Execute a task immediately if grid is green, otherwise delay until green window
 * Falls back to immediate execution if maxWaitHours is exceeded
 *
 * @param task - The async task to execute
 * @param lat - Latitude for grid lookup
 * @param lng - Longitude for grid lookup
 * @param maxWaitHours - Maximum hours to wait for green grid (default: 4)
 */
export async function deferToGreenGrid<T>(
  task: () => Promise<T>,
  lat: number,
  lng: number,
  maxWaitHours: number = 4
): Promise<T> {
  const schedule = await getBatchSchedule(lat, lng)

  // If grid is green now, execute immediately
  if (schedule.shouldRunNow) {
    console.log('[batch-scheduler] Grid is green, executing task immediately')
    return task()
  }

  // Calculate wait time
  const nextWindow = schedule.nextGreenWindow
  if (!nextWindow) {
    console.log('[batch-scheduler] No green window found, executing immediately')
    return task()
  }

  const waitMs = nextWindow.getTime() - Date.now()
  const waitHours = waitMs / (1000 * 60 * 60)

  if (waitHours > maxWaitHours) {
    console.log(`[batch-scheduler] Wait time (${waitHours.toFixed(1)}h) exceeds max (${maxWaitHours}h), executing immediately`)
    return task()
  }

  console.log(`[batch-scheduler] Waiting ${waitHours.toFixed(1)} hours for green grid`)

  // Wait and then execute
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await task()
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }, waitMs)
  })
}

/**
 * Execute a task for a specific user, deferring to green grid if possible
 */
export async function deferToGreenGridForUser<T>(
  task: () => Promise<T>,
  sessionId: string,
  maxWaitHours: number = 4
): Promise<T> {
  const coords = await getUserCoordinates(sessionId)
  if (!coords) {
    console.log('[batch-scheduler] No coordinates found for user, executing immediately')
    return task()
  }
  return deferToGreenGrid(task, coords.lat, coords.lng, maxWaitHours)
}

/**
 * Get batch schedule for a specific zone (by zone ID)
 * Uses approximate center coordinates for the zone
 */
export async function shouldRunBatchNowForZone(zone: string): Promise<boolean> {
  // Map zone to approximate center coordinates
  const zoneCoordinates: Record<string, { lat: number; lng: number }> = {
    'US-NY-NYIS': { lat: 40.7128, lng: -74.006 },
    'US-CAL-CISO': { lat: 37.7749, lng: -122.4194 },
    'US-TEX-ERCO': { lat: 30.2672, lng: -97.7431 },
    'US-MIDA-PJM': { lat: 39.2904, lng: -76.6122 },
  }

  const coords = zoneCoordinates[zone]
  if (!coords) {
    console.log(`[batch-scheduler] Unknown zone ${zone}, defaulting to run now`)
    return true
  }
  return shouldRunBatchNow(coords.lat, coords.lng)
}
