'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LOADING_MESSAGES = [
  'Analyzing your lifestyle...',
  'Finding your biggest impact areas...',
  'Calculating your footprint...',
  'Personalizing your journey...',
  'Preparing your first action...',
]

export function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center px-4"
    >
      {/* Animated spinner */}
      <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-4 border-green-800/30"
        />
        {/* Spinning arc */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500"
        />
        {/* Inner pulse */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center"
        >
          <span className="text-white font-bold text-lg">S</span>
        </motion.div>
      </div>

      {/* Rotating messages */}
      <div className="h-16 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-green-50 mb-2">
              {LOADING_MESSAGES[messageIndex]}
            </h2>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {LOADING_MESSAGES.map((_, index) => (
          <motion.div
            key={index}
            animate={{
              scale: index === messageIndex ? 1.2 : 1,
              backgroundColor: index === messageIndex ? '#22c55e' : '#166534',
            }}
            className="w-2 h-2 rounded-full"
          />
        ))}
      </div>

      <p className="text-green-400 text-sm mt-6">
        This usually takes a few seconds
      </p>
    </motion.div>
  )
}
