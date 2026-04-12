'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface AddressCaptureProps {
  onSubmit: (data: { city: string; homeAddress?: string; workAddress?: string }) => void
  isLoading?: boolean
}

export function AddressCapture({ onSubmit, isLoading = false }: AddressCaptureProps) {
  const [city, setCity] = useState('')
  const [homeAddress, setHomeAddress] = useState('')
  const [workAddress, setWorkAddress] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!city.trim()) return

    onSubmit({
      city: city.trim(),
      homeAddress: homeAddress.trim() || undefined,
      workAddress: workAddress.trim() || undefined,
    })
  }

  const canSubmit = city.trim().length > 0 && !isLoading

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md bg-[#1a2e1a] border-green-800/30">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl md:text-2xl text-green-50 leading-tight">
            Where are you located?
          </CardTitle>
          <CardDescription className="text-green-400 mt-2">
            We use this to personalize your actions with local weather and transit data
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* City - Required */}
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium text-green-300">
                City *
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., New York, San Francisco"
                className="w-full px-4 py-3 rounded-xl bg-[#0f1a0f] border border-green-800/30
                         text-green-50 placeholder-green-600
                         focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent
                         transition-all"
                required
              />
            </div>

            {/* Home Address - Optional */}
            <div className="space-y-2">
              <label htmlFor="homeAddress" className="text-sm font-medium text-green-300">
                Home Address
                <span className="text-green-600 ml-1">(optional)</span>
              </label>
              <input
                id="homeAddress"
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="For weather-based suggestions"
                className="w-full px-4 py-3 rounded-xl bg-[#0f1a0f] border border-green-800/30
                         text-green-50 placeholder-green-600
                         focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent
                         transition-all"
              />
            </div>

            {/* Work Address - Optional */}
            <div className="space-y-2">
              <label htmlFor="workAddress" className="text-sm font-medium text-green-300">
                Work Address
                <span className="text-green-600 ml-1">(optional)</span>
              </label>
              <input
                id="workAddress"
                type="text"
                value={workAddress}
                onChange={(e) => setWorkAddress(e.target.value)}
                placeholder="For commute-based suggestions"
                className="w-full px-4 py-3 rounded-xl bg-[#0f1a0f] border border-green-800/30
                         text-green-50 placeholder-green-600
                         focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent
                         transition-all"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.02 } : {}}
              whileTap={canSubmit ? { scale: 0.98 } : {}}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all mt-6
                        ${canSubmit
                          ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
                          : 'bg-green-800/30 text-green-600 cursor-not-allowed'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                'Generate My Profile'
              )}
            </motion.button>

            <p className="text-center text-green-600 text-xs mt-3">
              Your data stays private and is only used for personalization
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
