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
