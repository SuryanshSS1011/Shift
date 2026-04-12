'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body className="bg-[#0f1a0f] min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-green-50 mb-2">
            Something went wrong
          </h2>
          <p className="text-green-400 mb-6">
            We&apos;ve been notified and are working on a fix.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
