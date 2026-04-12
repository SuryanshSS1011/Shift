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
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!city.trim()) return

    onSubmit({
      city: city.trim(),
      homeAddress: homeAddress.trim() || undefined,
      workAddress: workAddress.trim() || undefined,
    })
  }

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Use OpenStreetMap's Nominatim for reverse geocoding (free, no API key needed)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            {
              headers: {
                'User-Agent': 'Shift-App/1.0',
              },
            }
          )

          if (!response.ok) {
            throw new Error('Failed to get location details')
          }

          const data = await response.json()

          // Extract city from response (try different fields)
          const cityName = data.address?.city ||
                          data.address?.town ||
                          data.address?.municipality ||
                          data.address?.county ||
                          data.address?.state

          if (cityName) {
            // Add state for US locations
            const state = data.address?.state
            const country = data.address?.country_code?.toUpperCase()

            if (country === 'US' && state && state !== cityName) {
              setCity(`${cityName}, ${state}`)
            } else {
              setCity(cityName)
            }
          } else {
            setLocationError('Could not determine your city')
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err)
          setLocationError('Could not get location details')
        } finally {
          setIsLocating(false)
        }
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enter your city manually.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable. Please enter your city manually.')
            break
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.')
            break
          default:
            setLocationError('Could not get your location. Please enter manually.')
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    )
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
            {/* Geolocation Button */}
            <motion.button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating || isLoading}
              whileHover={!isLocating && !isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLocating && !isLoading ? { scale: 0.98 } : {}}
              className="w-full py-3 rounded-xl font-medium text-sm transition-all
                       border border-green-600 text-green-400 hover:bg-green-600/10
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {isLocating ? (
                <>
                  <span className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  Detecting location...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Use my location
                </>
              )}
            </motion.button>

            {locationError && (
              <p className="text-red-400 text-xs text-center">{locationError}</p>
            )}

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-green-800/30" />
              <span className="text-green-600 text-xs">or enter manually</span>
              <div className="flex-1 h-px bg-green-800/30" />
            </div>

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
