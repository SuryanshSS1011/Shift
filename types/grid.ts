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
  }
  worstWindow: {
    startHour: number
    endHour: number
    avgIntensity: number
  }
}

export interface GridForecastResponse {
  zone: string
  forecast: ForecastDataPoint[]
  bestTime: {
    label: string
    startHour: number
    endHour: number
    intensity: number
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
