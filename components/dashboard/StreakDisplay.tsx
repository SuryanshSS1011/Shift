'use client'

import { motion } from 'framer-motion'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  const isNewRecord = currentStreak > 0 && currentStreak >= longestStreak

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#1a2e1a] rounded-2xl p-6 border border-green-800/30"
    >
      <div className="flex items-center justify-between">
        {/* Current Streak */}
        <div className="text-center flex-1">
          <motion.div
            key={currentStreak}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.3 }}
            className="text-5xl font-bold text-green-50 mb-1"
          >
            {currentStreak}
          </motion.div>
          <div className="text-green-400 text-sm">
            day streak
          </div>
          {isNewRecord && currentStreak > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-yellow-400 text-xs mt-1"
            >
              New record!
            </motion.div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-16 bg-green-800/50 mx-6" />

        {/* Best Streak */}
        <div className="text-center flex-1">
          <div className="text-3xl font-bold text-green-300 mb-1">
            {longestStreak}
          </div>
          <div className="text-green-400 text-sm">best streak</div>
        </div>
      </div>

      {/* Streak Message */}
      <div className="mt-4 pt-4 border-t border-green-800/30 text-center">
        <p className="text-green-300 text-sm">
          {currentStreak === 0 && "Complete today's action to start your streak!"}
          {currentStreak === 1 && "Great start! Keep it going tomorrow."}
          {currentStreak >= 2 && currentStreak < 7 && "You're building momentum!"}
          {currentStreak >= 7 && currentStreak < 30 && "Incredible consistency! You're on fire!"}
          {currentStreak >= 30 && "Legendary streak! You're a sustainability champion!"}
        </p>
      </div>
    </motion.div>
  )
}
