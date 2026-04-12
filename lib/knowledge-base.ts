import type { ActionCandidate, UserProfile, ActionCategory } from '@/types/action'
import actionLibrary from '@/data/knowledge-base/action-library.json'

// Type assertion for the imported JSON
const actions = actionLibrary as ActionCandidate[]

/**
 * Scoring weights as specified in CLAUDE.md:
 * - Category matches one of user's top impact areas: +3
 * - Applicable to user's diet pattern (or "all"): +2
 * - Applicable to user's living situation (or "all"): +2
 * - Applicable to user's commute type (or "all"): +1
 * - Not completed in the last 7 days: +2
 * - Difficulty matches streak level: +1
 * - Applicable to user's city (or "all"): +1
 */
const SCORING_WEIGHTS = {
  categoryMatch: 3,
  dietPatternMatch: 2,
  livingSituationMatch: 2,
  commuteTypeMatch: 1,
  notRecentlyCompleted: 2,
  difficultyMatch: 1,
  cityMatch: 1,
}

interface ScoredAction {
  action: ActionCandidate
  score: number
}

/**
 * Determines the appropriate difficulty level based on streak length.
 * - Streak < 7: "easy"
 * - Streak 7-30: "medium"
 * - Streak > 30: any difficulty is appropriate
 */
function getAppropriateDifficulty(streak: number): 'easy' | 'medium' | 'any' {
  if (streak < 7) return 'easy'
  if (streak <= 30) return 'medium'
  return 'any'
}

/**
 * Checks if an array contains "all" or a specific value.
 */
function matchesOrAll(applicable: string[], value: string): boolean {
  return applicable.includes('all') || applicable.includes(value)
}

/**
 * Maps livingSituation from UserProfile to action library values.
 * The action library uses: "city_apartment", "urban_house", "suburbs", "rural"
 */
function mapLivingSituation(livingSituation: string): string {
  // Direct mapping - action library values match UserProfile values
  return livingSituation
}

/**
 * Scores a single action candidate against a user profile.
 */
function scoreAction(
  action: ActionCandidate,
  profile: UserProfile,
  recentActionIds: string[],
  currentStreak: number
): number {
  let score = 0

  // Category matches one of user's top impact areas: +3
  if (profile.topImpactAreas.includes(action.category)) {
    score += SCORING_WEIGHTS.categoryMatch
  }

  // Applicable to user's diet pattern (or "all"): +2
  if (matchesOrAll(action.applicableDietPatterns, profile.dietPattern)) {
    score += SCORING_WEIGHTS.dietPatternMatch
  } else {
    // If diet pattern doesn't match, significantly penalize
    score -= 10
  }

  // Applicable to user's living situation (or "all"): +2
  const mappedLivingSituation = mapLivingSituation(profile.livingSituation)
  if (matchesOrAll(action.applicableLivingSituations, mappedLivingSituation)) {
    score += SCORING_WEIGHTS.livingSituationMatch
  } else {
    // If living situation doesn't match, significantly penalize
    score -= 10
  }

  // Applicable to user's commute type (or "all"): +1
  if (matchesOrAll(action.applicableCommuteTypes, profile.commuteType)) {
    score += SCORING_WEIGHTS.commuteTypeMatch
  } else {
    // If commute type doesn't match, significantly penalize
    score -= 10
  }

  // Not completed in the last 7 days: +2
  if (!recentActionIds.includes(action.id)) {
    score += SCORING_WEIGHTS.notRecentlyCompleted
  } else {
    // Recently completed actions get a penalty
    score -= 5
  }

  // Difficulty matches streak level: +1
  const appropriateDifficulty = getAppropriateDifficulty(currentStreak)
  if (appropriateDifficulty === 'any') {
    score += SCORING_WEIGHTS.difficultyMatch
  } else if (action.difficulty === appropriateDifficulty) {
    score += SCORING_WEIGHTS.difficultyMatch
  } else if (appropriateDifficulty === 'medium' && action.difficulty === 'easy') {
    // Easy is also acceptable for medium streak users
    score += SCORING_WEIGHTS.difficultyMatch * 0.5
  }

  // Applicable to user's city (or "all"): +1
  if (matchesOrAll(action.applicableCities, profile.city)) {
    score += SCORING_WEIGHTS.cityMatch
  }

  // Bonus for matching primary motivation with behavioral frame
  const motivationFrameMap: Record<string, string[]> = {
    money: ['cost'],
    planet: ['values', 'identity'],
    health: ['health'],
    community: ['identity', 'values'],
  }
  const preferredFrames = motivationFrameMap[profile.primaryMotivation] || []
  if (preferredFrames.includes(action.behavioralFramePrimary)) {
    score += 1
  }

  // Bonus for matching primary barrier with action characteristics
  if (profile.primaryBarrier === 'time' && action.timeRequiredMinutes <= 2) {
    score += 1
  }
  if (profile.primaryBarrier === 'cost' && action.dollarSavingsPerOccurrence > 0) {
    score += 1
  }

  return score
}

/**
 * Searches for the best action candidates matching a user profile.
 * Returns the top N candidates sorted by score.
 */
export function searchActions(
  profile: UserProfile,
  recentActionIds: string[],
  currentStreak: number,
  count: number = 5
): ActionCandidate[] {
  // Score all actions
  const scoredActions: ScoredAction[] = actions.map(action => ({
    action,
    score: scoreAction(action, profile, recentActionIds, currentStreak),
  }))

  // Sort by score descending
  scoredActions.sort((a, b) => b.score - a.score)

  // Filter out actions with very negative scores (incompatible actions)
  const filteredActions = scoredActions.filter(sa => sa.score > 0)

  // Return top N actions
  return filteredActions.slice(0, count).map(sa => sa.action)
}

/**
 * Retrieves a specific action by ID.
 */
export function getActionById(id: string): ActionCandidate | null {
  return actions.find(action => action.id === id) || null
}

/**
 * Gets all actions for a specific category.
 */
export function getActionsByCategory(category: ActionCategory): ActionCandidate[] {
  return actions.filter(action => action.category === category)
}

/**
 * Gets a random fallback action for when AI generation fails.
 * Filters to easy actions that are broadly applicable.
 */
export function getFallbackAction(profile: UserProfile): ActionCandidate | null {
  const easyActions = actions.filter(action =>
    action.difficulty === 'easy' &&
    matchesOrAll(action.applicableDietPatterns, profile.dietPattern) &&
    matchesOrAll(action.applicableLivingSituations, profile.livingSituation) &&
    matchesOrAll(action.applicableCommuteTypes, profile.commuteType)
  )

  if (easyActions.length === 0) {
    // Absolute fallback - just return any easy action
    const anyEasy = actions.filter(a => a.difficulty === 'easy')
    return anyEasy[Math.floor(Math.random() * anyEasy.length)] || null
  }

  // Prefer actions in user's top impact areas
  const priorityActions = easyActions.filter(
    action => profile.topImpactAreas.includes(action.category)
  )

  const pool = priorityActions.length > 0 ? priorityActions : easyActions
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Gets the total count of actions in the library.
 */
export function getActionCount(): number {
  return actions.length
}

/**
 * Gets action counts by category.
 */
export function getActionCountsByCategory(): Record<ActionCategory, number> {
  const counts: Record<ActionCategory, number> = {
    food: 0,
    transport: 0,
    energy: 0,
    shopping: 0,
    water: 0,
    waste: 0,
  }

  for (const action of actions) {
    counts[action.category]++
  }

  return counts
}
