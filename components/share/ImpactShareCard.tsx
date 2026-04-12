'use client'

import { SDGBadgeGroup } from '@/components/shared/SDGBadge'
import type { LevelName } from '@/lib/points'

interface ImpactShareCardProps {
  level: LevelName
  levelEmoji: string
  totalCo2SavedKg: number
  totalPoints: number
  topSDGs: number[]
  currentStreak: number
  userName?: string
}

export function ImpactShareCard({
  level,
  levelEmoji,
  totalCo2SavedKg,
  totalPoints,
  topSDGs,
  currentStreak,
}: ImpactShareCardProps) {
  return (
    <div className="bg-[#1a2e1a] rounded-3xl p-8 border border-green-600/30 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">{levelEmoji}</div>
        <h2 className="text-2xl font-bold text-green-50">{level}</h2>
        <p className="text-green-400 text-sm">Shift Sustainability Hero</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0f1a0f] rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-50">
            {totalCo2SavedKg.toFixed(1)}
          </div>
          <div className="text-green-400 text-sm">kg CO₂ saved</div>
        </div>
        <div className="bg-[#0f1a0f] rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-50">
            {totalPoints.toLocaleString()}
          </div>
          <div className="text-green-400 text-sm">points earned</div>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-[#0f1a0f] rounded-xl p-4 text-center mb-6">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="text-2xl font-bold text-green-50">{currentStreak}</span>
          <span className="text-green-400">day streak</span>
        </div>
      </div>

      {/* SDG Contributions */}
      {topSDGs.length > 0 && (
        <div className="mb-6">
          <p className="text-green-400 text-sm text-center mb-3">
            Contributing to UN Sustainable Development Goals:
          </p>
          <div className="flex justify-center">
            <SDGBadgeGroup sdgIds={topSDGs} size="md" maxDisplay={3} />
          </div>
        </div>
      )}

      {/* Branding */}
      <div className="text-center pt-4 border-t border-green-800/30">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-lg font-bold text-green-50">Shift</span>
        </div>
        <p className="text-green-400/70 text-xs">
          One tiny action. One day at a time.
        </p>
      </div>
    </div>
  )
}
