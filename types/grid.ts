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
    nextBest?: {
      startHour: number
      endHour: number
    }
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
    nextBest?: {
      label: string
      startHour: number
      endHour: number
    }
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
