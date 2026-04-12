'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface WeeklyReportProps {
  report: {
    whatWentWell: string
    patternObserved: string
    focusThisWeek: string
  } | null
  totalActionsCompleted: number
}

export function WeeklyReport({ report, totalActionsCompleted }: WeeklyReportProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Show unlock message if user hasn't completed 7 actions yet
  if (totalActionsCompleted < 7) {
    return (
      <div className="bg-[#1a2e1a] rounded-2xl p-6 border border-green-800/30">
        <h3 className="text-green-300 text-sm font-medium mb-3">
          Weekly Report
        </h3>
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-green-800/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-green-400 text-sm">
            Complete {7 - totalActionsCompleted} more action{7 - totalActionsCompleted !== 1 ? 's' : ''} to unlock your first weekly report
          </p>
        </div>
      </div>
    )
  }

  // Show placeholder if no report yet
  if (!report) {
    return (
      <div className="bg-[#1a2e1a] rounded-2xl p-6 border border-green-800/30">
        <h3 className="text-green-300 text-sm font-medium mb-3">
          Weekly Report
        </h3>
        <p className="text-green-400 text-sm text-center py-4">
          Your weekly report will appear here soon.
        </p>
      </div>
    )
  }

  // Get first sentence for preview
  const firstSentence = report.whatWentWell.split('.')[0] + '.'

  return (
    <div className="bg-[#1a2e1a] rounded-2xl p-6 border border-green-800/30">
      <h3 className="text-green-300 text-sm font-medium mb-3">
        Weekly Report
      </h3>

      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-green-50 text-sm mb-3">
              {firstSentence}
            </p>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-green-400 text-sm hover:text-green-300 transition-colors flex items-center gap-1"
            >
              Read your Shift Report
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="border-l-2 border-green-600 pl-4">
              <h4 className="text-green-300 text-xs font-medium mb-1 uppercase tracking-wider">
                What went well
              </h4>
              <p className="text-green-50 text-sm">
                {report.whatWentWell}
              </p>
            </div>

            <div className="border-l-2 border-green-600 pl-4">
              <h4 className="text-green-300 text-xs font-medium mb-1 uppercase tracking-wider">
                Pattern observed
              </h4>
              <p className="text-green-50 text-sm">
                {report.patternObserved}
              </p>
            </div>

            <div className="border-l-2 border-green-600 pl-4">
              <h4 className="text-green-300 text-xs font-medium mb-1 uppercase tracking-wider">
                Focus this week
              </h4>
              <p className="text-green-50 text-sm">
                {report.focusThisWeek}
              </p>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="text-green-400 text-sm hover:text-green-300 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Collapse
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
