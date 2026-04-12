import type { ActionCandidate } from '@/types/action'
import type { UserProfile } from '@/types/user'

interface WeatherData {
  temperature: number
  description: string
}

export function buildActionPrompt(
  profile: UserProfile,
  candidates: ActionCandidate[],
  streakLength: number,
  weather?: WeatherData
): string {
  const today = new Date()
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  let prompt = `USER PROFILE:
- City: ${profile.city}
- Commute: ${profile.commuteType}${profile.commuteDistanceMiles ? ` (${profile.commuteDistanceMiles} miles)` : ''}
- Diet: ${profile.dietPattern}
- Living situation: ${profile.livingSituation}
- Primary barrier: ${profile.primaryBarrier}
- Primary motivation: ${profile.primaryMotivation}
- Top impact areas: ${profile.topImpactAreas.join(', ')}

TODAY: ${dayOfWeek}, ${dateStr}
STREAK: ${streakLength} days`

  if (weather) {
    prompt += `\nWEATHER: ${weather.temperature}°F, ${weather.description}`
  }

  if (streakLength > 7) {
    prompt += `\n\nNote: User is on a strong streak — a slightly more ambitious action is appropriate.`
  }

  prompt += `\n\nCANDIDATE ACTIONS (select one and personalize it):\n`

  candidates.forEach((candidate, index) => {
    prompt += `\n${index + 1}. ${candidate.title}
   Category: ${candidate.category}
   CO₂ saved: ${candidate.co2SavingsKgPerOccurrence} kg
   $ saved: $${candidate.dollarSavingsPerOccurrence.toFixed(2)}
   Time: ${candidate.timeRequiredMinutes} min
   Difficulty: ${candidate.difficulty}
   Frame: ${candidate.behavioralFramePrimary}
   Equivalency: ${candidate.equivalencyLabel}\n`
  })

  prompt += `\nINSTRUCTIONS:
1. Select the single best candidate for this user today
2. Rewrite the description to be hyper-specific to their city, constraints, and context
3. Create an anchor habit based on their likely daily routine
4. Use only the CO₂ and dollar values from the candidate you select — never invent figures`

  return prompt
}
