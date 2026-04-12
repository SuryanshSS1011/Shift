import type { OnboardingAnswers } from '@/types/user'

export function buildProfilePrompt(answers: OnboardingAnswers): string {
  return `Analyze this user's sustainability profile based on their onboarding answers:

COMMUTE TYPE: ${answers.commuteType}
DIET PATTERN: ${answers.dietPattern}
LIVING SITUATION: ${answers.livingSituation}
PRIMARY BARRIER: ${answers.primaryBarrier}
PRIMARY MOTIVATION: ${answers.primaryMotivation}
CITY: ${answers.city}

Based on these answers:
1. Identify the top 3 impact areas where this user can make the biggest difference (from: food, transport, energy, shopping, water, waste)
2. Estimate their annual carbon footprint in kg CO₂ using simplified EPA averages for their profile
3. Write a 2-sentence encouraging profile summary that acknowledges their motivation and highlights their biggest opportunity

Use these rough US averages for estimation:
- Drive alone: ~4,600 kg CO₂/year from commuting
- Transit: ~1,200 kg CO₂/year from commuting
- Bike/walk/WFH: ~100 kg CO₂/year from commuting
- Meat most days: ~2,500 kg CO₂/year from food
- Chicken/fish mainly: ~1,800 kg CO₂/year from food
- Mostly plant-based: ~1,200 kg CO₂/year from food
- Vegan/vegetarian: ~800 kg CO₂/year from food
- Average US household energy: ~7,500 kg CO₂/year
- City apartment: 70% of average
- Suburbs/rural house: 120% of average`
}
