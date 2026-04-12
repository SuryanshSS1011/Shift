'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShareButton } from '@/components/shared/ShareButton'

interface CelebrationOverlayProps {
  isVisible: boolean
  onClose: () => void
  co2Saved: number
  streak: number
  pointsEarned?: number
  totalCo2Saved?: number
  totalActionsCompleted?: number
}

export function CelebrationOverlay({
  isVisible,
  onClose,
  co2Saved,
  streak,
  pointsEarned = 0,
  totalCo2Saved = 0,
  totalActionsCompleted = 0,
}: CelebrationOverlayProps) {
  const [showShareOptions, setShowShareOptions] = useState(false)

  // Auto-close after 5 seconds (longer to allow for sharing)
  useEffect(() => {
    if (isVisible && !showShareOptions) {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose, showShareOptions])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="bg-[#1a2e1a] rounded-3xl p-8 max-w-sm w-full text-center border border-green-600/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 10, delay: 0.2 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full mb-6"
            >
              <motion.svg
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </motion.svg>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-green-50 mb-2"
            >
              Amazing Work!
            </motion.h2>

            {/* Impact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4"
            >
              <div className="flex items-center justify-center gap-3">
                <div>
                  <span className="text-4xl font-bold text-green-400">
                    {co2Saved} kg
                  </span>
                  <p className="text-green-300 text-sm">CO₂ saved</p>
                </div>
                {pointsEarned > 0 && (
                  <div>
                    <span className="text-4xl font-bold text-yellow-400">
                      +{pointsEarned}
                    </span>
                    <p className="text-yellow-300 text-sm">points</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#0f1a0f] rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-green-50">
                  {streak} day{streak !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-green-400 text-sm">streak</p>
            </motion.div>

            {/* Share and Close buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <button
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Your Impact
              </button>

              {showShareOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <ShareButton
                    variant="card"
                    stats={{
                      co2Saved: totalCo2Saved || co2Saved,
                      streak,
                      actionsCompleted: totalActionsCompleted,
                    }}
                  />
                </motion.div>
              )}

              <button
                onClick={onClose}
                className="text-green-400 hover:text-green-300 text-sm"
              >
                {showShareOptions ? 'Close' : 'Tap anywhere to continue'}
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
