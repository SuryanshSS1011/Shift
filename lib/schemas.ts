import { z } from 'zod'

export const MicroActionOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  anchorHabit: z.string(),
  co2SavingsKg: z.number().positive(),
  dollarSavings: z.number().nonnegative(),
  timeRequiredMinutes: z.number().int().nonnegative(),
  difficultyLevel: z.enum(['easy', 'medium', 'challenge']),
  behavioralFrame: z.enum(['cost', 'values', 'health', 'convenience', 'identity']),
  equivalencyLabel: z.string(),
  category: z.enum(['food', 'transport', 'energy', 'shopping', 'water', 'waste']),
})

export const UserProfileOutputSchema = z.object({
  topImpactAreas: z.array(z.enum(['food', 'transport', 'energy', 'shopping', 'water', 'waste'])).length(3),
  estimatedAnnualFootprintKg: z.number().positive(),
  aiProfileSummary: z.string().max(300),
})

export const WeeklyReportOutputSchema = z.object({
  whatWentWell: z.string(),
  patternObserved: z.string(),
  focusThisWeek: z.string(),
})

export type MicroActionOutput = z.infer<typeof MicroActionOutputSchema>
export type UserProfileOutput = z.infer<typeof UserProfileOutputSchema>
export type WeeklyReportOutput = z.infer<typeof WeeklyReportOutputSchema>

// Grid Forecast Schemas
export const ForecastDataPointSchema = z.object({
  datetime: z.string(),
  carbonIntensity: z.number(),
})

export const GridForecastOutputSchema = z.object({
  zone: z.string(),
  forecast: z.array(ForecastDataPointSchema),
  bestTime: z.object({
    label: z.string(),
    startHour: z.number().int().min(0).max(23),
    endHour: z.number().int().min(0).max(23),
    intensity: z.number(),
  }),
  currentIntensity: z.number(),
  currentLevel: z.enum(['low', 'moderate', 'high']),
})

export type ForecastDataPointOutput = z.infer<typeof ForecastDataPointSchema>
export type GridForecastOutput = z.infer<typeof GridForecastOutputSchema>
