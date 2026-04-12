'use client'

import { motion } from 'framer-motion'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  const isNewRecord = currentStreak > 0 && currentStreak >= longestStreak

  // Progress toward 30-day goal
  const goalDays = 30
  const progressPercent = Math.min((currentStreak / goalDays) * 100, 100)

  // Dynamic color based on progress
  const getPathColor = () => {
    if (currentStreak >= goalDays) return '#fbbf24' // Gold for goal achieved
    if (currentStreak >= 21) return '#4ade80' // Bright green for 70%+
    if (currentStreak >= 14) return '#22c55e' // Green for 47%+
    if (currentStreak >= 7) return '#10b981' // Emerald for 23%+
    return '#34d399' // Light emerald for starting out
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#1a2e1a] rounded-2xl p-6 border border-green-800/30"
    >
      <div className="flex items-center justify-between">
        {/* Current Streak with Circular Progress */}
        <div className="text-center flex-1">
          <div className="w-28 h-28 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <CircularProgressbar
              value={progressPercent}
              text={`${currentStreak}`}
              styles={buildStyles({
                textSize: '28px',
                pathColor: getPathColor(),
                textColor: '#f0fdf4',
                trailColor: 'rgba(34, 197, 94, 0.15)',
                pathTransitionDuration: 0.5,
                strokeLinecap: 'round',
              })}
            />
          </div>
          <motion.div
            key={currentStreak}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            className="text-green-400 text-sm"
          >
            day streak
          </motion.div>
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
        <div className="w-px h-24 bg-green-800/50 mx-4" />

        {/* Best Streak & Goal */}
        <div className="flex-1 space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-300">
              {longestStreak}
            </div>
            <div className="text-green-400 text-xs">best streak</div>
          </div>
          <div className="text-center pt-2 border-t border-green-800/30">
            <div className="text-lg font-semibold text-green-50">
              {goalDays - currentStreak > 0 ? goalDays - currentStreak : 0}
            </div>
            <div className="text-green-400 text-xs">days to 30-day goal</div>
          </div>
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
