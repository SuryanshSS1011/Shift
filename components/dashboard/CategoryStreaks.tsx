'use client'

import { motion } from 'framer-motion'
import type { CategoryStreak } from '@/types/impact'

interface CategoryStreaksProps {
  streaks: CategoryStreak[]
}

const categoryEmojis: Record<string, string> = {
  food: '🍽️',
  transport: '🚇',
  energy: '⚡',
  shopping: '🛍️',
  water: '💧',
  waste: '♻️',
}

const categoryColors: Record<string, string> = {
  food: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  transport: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  energy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  shopping: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  water: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  waste: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

export function CategoryStreaks({ streaks }: CategoryStreaksProps) {
  // Filter to only show categories with active streaks
  const activeStreaks = streaks.filter((s) => s.currentStreak > 0)

  if (activeStreaks.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-green-400">Category Streaks</h4>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {activeStreaks.map((streak, index) => {
          const emoji = categoryEmojis[streak.category] || '📌'
          const colorClass = categoryColors[streak.category] || 'bg-green-500/20 text-green-400 border-green-500/30'

          return (
            <motion.div
              key={streak.category}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`flex-shrink-0 px-3 py-2 rounded-lg border ${colorClass} flex items-center gap-2`}
              title={`${streak.category}: ${streak.currentStreak} day streak (best: ${streak.longestStreak})`}
            >
              <span className="text-lg">{emoji}</span>
              <span className="font-bold">{streak.currentStreak}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
