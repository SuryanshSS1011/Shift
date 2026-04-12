'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo } from '@/components/shared/Logo'

interface OnboardingShellProps {
  children: React.ReactNode
  showBackButton?: boolean
  onBack?: () => void
}

export function OnboardingShell({ children, showBackButton, onBack }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-[#0f1a0f] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-4 px-4 border-b border-green-800/30"
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {/* Left - Back button */}
          <div className="w-20">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
                aria-label="Go back"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back</span>
              </button>
            )}
          </div>

          {/* Center - Logo */}
          <Link href="/" className="flex items-center">
            <Logo variant="reversed-dark" size="sm" />
          </Link>

          {/* Right - Exit link */}
          <div className="w-20 text-right">
            <Link
              href="/"
              className="text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              Exit
            </Link>
          </div>
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
