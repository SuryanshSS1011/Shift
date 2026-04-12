'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface HeaderProps {
  showBackButton?: boolean
  onBack?: () => void
  showMenu?: boolean
  isDemoMode?: boolean
}

export function Header({ showBackButton, onBack, showMenu = false, isDemoMode = false }: HeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const sessionId = localStorage.getItem('shift_session_id')
    setHasSession(!!sessionId)
  }, [])

  const handleResetProfile = () => {
    if (confirm('This will delete all your data and start fresh. Are you sure?')) {
      localStorage.removeItem('shift_session_id')
      // Use window.location for full page reload to clear any cached state
      window.location.href = '/onboarding'
    }
    setMenuOpen(false)
  }

  const isOnboarding = pathname === '/onboarding'
  const isDashboard = pathname === '/dashboard'
  const isLanding = pathname === '/'
  const isSettings = pathname === '/settings'
  const isHistory = pathname === '/history'
  const isProfile = pathname === '/profile'
  const showMenuButton = showMenu || isDashboard || isSettings || isHistory || isProfile

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-4 border-b border-green-800/30 bg-[#0f1a0f]/95 backdrop-blur-sm sticky top-0 z-50"
    >
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Left side - Back button or Logo */}
        <div className="flex items-center gap-3">
          {showBackButton && onBack ? (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-green-400 hover:text-green-300 transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : null}

          <Link href={hasSession ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center group-hover:bg-green-500 transition-colors">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-green-50">Shift</span>
          </Link>

          {isDemoMode && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              Demo
            </span>
          )}
        </div>

        {/* Right side - Navigation / Menu */}
        <div className="flex items-center gap-2">
          {/* Quick links based on context */}
          {isLanding && !hasSession && (
            <Link
              href="/dashboard?demo=true"
              className="text-sm text-green-400 hover:text-green-300 transition-colors px-3 py-1.5"
            >
              Try Demo
            </Link>
          )}

          {isOnboarding && (
            <Link
              href="/"
              className="text-sm text-green-400 hover:text-green-300 transition-colors px-3 py-1.5"
            >
              Exit
            </Link>
          )}

          {/* Menu Button */}
          {showMenuButton && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-green-400 hover:text-green-300 transition-colors rounded-lg hover:bg-green-800/20"
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />

                    {/* Menu dropdown */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-[#1a2e1a] border border-green-800/50 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="py-1">
                        <Link
                          href="/"
                          className="flex items-center gap-3 px-4 py-3 text-green-50 hover:bg-green-800/30 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Home
                        </Link>

                        {!isDemoMode && (
                          <>
                            <Link
                              href="/dashboard"
                              className="flex items-center gap-3 px-4 py-3 text-green-50 hover:bg-green-800/30 transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                              </svg>
                              Dashboard
                            </Link>

                            <Link
                              href="/eco-llm"
                              className="flex items-center gap-3 px-4 py-3 text-green-50 hover:bg-green-800/30 transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Eco LLM
                            </Link>

                            <Link
                              href="/history"
                              className="flex items-center gap-3 px-4 py-3 text-green-50 hover:bg-green-800/30 transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Action History
                            </Link>

                            <Link
                              href="/profile"
                              className="flex items-center gap-3 px-4 py-3 text-green-50 hover:bg-green-800/30 transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              My Profile
                            </Link>

                            <Link
                              href="/settings"
                              className="flex items-center gap-3 px-4 py-3 text-green-50 hover:bg-green-800/30 transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Settings
                            </Link>

                            <div className="border-t border-green-800/30 my-1" />

                            <Link
                              href="/onboarding?retake=true"
                              className="flex items-center gap-3 px-4 py-3 text-green-50 hover:bg-green-800/30 transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Retake Quiz
                            </Link>

                            <button
                              onClick={handleResetProfile}
                              className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 transition-colors w-full text-left"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete All Data
                            </button>
                          </>
                        )}

                        {isDemoMode && (
                          <>
                            <div className="border-t border-green-800/30 my-1" />
                            <Link
                              href="/onboarding"
                              className="flex items-center gap-3 px-4 py-3 text-green-400 hover:bg-green-800/30 transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                              Create Real Profile
                            </Link>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
