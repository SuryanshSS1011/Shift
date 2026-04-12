import type { ActionCandidate, UserProfile } from '@/types/action'

// Placeholder - will be implemented in Phase 2
export function searchActions(
  profile: UserProfile,
  recentActionIds: string[],
  currentStreak: number,
  count: number
): ActionCandidate[] {
  // Implementation will load from data/knowledge-base/action-library.json
  // and score candidates based on profile match
  return []
}

export function getActionById(id: string): ActionCandidate | null {
  // Implementation will load from data/knowledge-base/action-library.json
  return null
}
