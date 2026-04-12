'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CelebrationOverlayProps {
  isVisible: boolean
  onClose: () => void
  co2Saved: number
  streak: number
}

export function CelebrationOverlay({
  isVisible,
  onClose,
  co2Saved,
  streak,
}: CelebrationOverlayProps) {
  // Auto-close after 3 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

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
              <span className="text-4xl font-bold text-green-400">
                {co2Saved} kg
              </span>
              <p className="text-green-300 text-sm">CO₂ saved today</p>
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

            {/* Close button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={onClose}
              className="text-green-400 hover:text-green-300 text-sm"
            >
              Tap anywhere to continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
