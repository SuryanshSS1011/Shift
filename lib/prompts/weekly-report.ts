import type { MicroAction } from '@/types/action'

export function buildReportPrompt(actions: MicroAction[]): string {
  const completedActions = actions.filter(a => a.completed)
  const skippedActions = actions.filter(a => !a.completed)

  let prompt = `Generate a warm, encouraging weekly sustainability report for this user.

COMPLETED ACTIONS (${completedActions.length}):
${completedActions.map(a => `- ${a.title} (${a.category}, ${a.co2SavingsKg} kg CO₂ saved)`).join('\n')}

SKIPPED ACTIONS (${skippedActions.length}):
${skippedActions.map(a => `- ${a.title} (${a.category})`).join('\n')}

TOTAL IMPACT THIS WEEK:
- CO₂ saved: ${completedActions.reduce((sum, a) => sum + a.co2SavingsKg, 0).toFixed(1)} kg
- Money saved: $${completedActions.reduce((sum, a) => sum + a.dollarSavings, 0).toFixed(2)}

Write a 3-paragraph narrative report:
1. whatWentWell: Celebrate specific wins from this week (mention specific actions)
2. patternObserved: Note any patterns in what they completed vs. skipped, without judgment
3. focusThisWeek: Suggest one specific focus for next week based on their patterns

Keep the tone warm, encouraging, and specific. Never guilt or shame for skipped actions.`

  return prompt
}
