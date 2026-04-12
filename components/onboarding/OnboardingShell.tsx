'use client'

import { motion } from 'framer-motion'

interface OnboardingShellProps {
  children: React.ReactNode
}

export function OnboardingShell({ children }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-[#0f1a0f] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-6 px-4 text-center"
      >
        <div className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-xl font-bold text-green-50">Shift</span>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center">
        <p className="text-green-400 text-sm">
          90 seconds to your personalized sustainability plan
        </p>
      </footer>
    </div>
  )
}
