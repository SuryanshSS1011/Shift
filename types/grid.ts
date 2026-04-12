export type IntensityLevel = 'low' | 'moderate' | 'high'

export interface ForecastDataPoint {
  datetime: string
  carbonIntensity: number
}

export interface GridForecast {
  zone: string
  forecast: ForecastDataPoint[]
  updatedAt: string
  bestWindow: {
    startHour: number
    endHour: number
    avgIntensity: number
    level: BestTimeLevel
  }
  worstWindow: {
    startHour: number
    endHour: number
    avgIntensity: number
  }
}

export type BestTimeLevel = 'low' | 'moderate_fallback' | 'high_all_day'

export interface GridForecastResponse {
  zone: string
  forecast: ForecastDataPoint[]
  bestTime: {
    label: string
    startHour: number
    endHour: number
    intensity: number
    level: BestTimeLevel
  }
  currentIntensity: number
  currentLevel: IntensityLevel
}

export interface BatchScheduleResult {
  shouldRunNow: boolean
  nextGreenWindow: Date | null
  currentIntensity: number
  currentPercentile: number
}
