'use client'

import sdgsData from '@/data/sdgs.json'

interface SDG {
  id: number
  name: string
  shortName: string
  color: string
  emoji: string
}

const sdgsMap = new Map<number, SDG>(
  sdgsData.map((sdg) => [sdg.id, sdg as SDG])
)

interface SDGBadgeProps {
  sdgId: number
  size?: 'sm' | 'md'
  showTooltip?: boolean
}

export function SDGBadge({ sdgId, size = 'sm', showTooltip = true }: SDGBadgeProps) {
  const sdg = sdgsMap.get(sdgId)

  if (!sdg) {
    return null
  }

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white cursor-default`}
      style={{ backgroundColor: sdg.color }}
      title={showTooltip ? `SDG ${sdg.id}: ${sdg.name}` : undefined}
    >
      {sdg.id}
    </div>
  )
}

interface SDGBadgeGroupProps {
  sdgIds: number[]
  size?: 'sm' | 'md'
  maxDisplay?: number
}

export function SDGBadgeGroup({
  sdgIds,
  size = 'sm',
  maxDisplay = 3,
}: SDGBadgeGroupProps) {
  const displayIds = sdgIds.slice(0, maxDisplay)
  const remaining = sdgIds.length - maxDisplay

  return (
    <div className="flex items-center gap-1">
      {displayIds.map((id) => (
        <SDGBadge key={id} sdgId={id} size={size} />
      ))}
      {remaining > 0 && (
        <span className="text-green-400 text-xs ml-1">+{remaining}</span>
      )}
    </div>
  )
}

/**
 * Get SDG data by ID
 */
export function getSDG(id: number): SDG | undefined {
  return sdgsMap.get(id)
}

/**
 * Get multiple SDGs by IDs
 */
export function getSDGs(ids: number[]): SDG[] {
  return ids
    .map((id) => sdgsMap.get(id))
    .filter((sdg): sdg is SDG => sdg !== undefined)
}

/**
 * Get top N SDGs from an array, sorted by frequency
 */
export function getTopSDGs(
  sdgArrays: number[][],
  topN: number = 3
): { sdg: SDG; count: number }[] {
  const counts = new Map<number, number>()

  for (const sdgIds of sdgArrays) {
    for (const id of sdgIds) {
      counts.set(id, (counts.get(id) || 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id, count]) => ({
      sdg: sdgsMap.get(id)!,
      count,
    }))
    .filter((item) => item.sdg !== undefined)
}
