'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/shared/Header'
import { formatCO2 } from '@/lib/emissions/calculator'

interface ProfileData {
  profile: {
    id: string
    city: string
    commuteType: string
    commuteDistanceMiles: number | null
    dietPattern: string
    livingSituation: string
    primaryBarrier: string
    primaryMotivation: string
    aiProfileSummary: string
    topImpactAreas: string[]
    estimatedAnnualFootprintKg: number
    electricityZone: string | null
    createdAt: string
  }
  stats: {
    currentStreak: number
    longestStreak: number
    totalCo2SavedKg: number
    totalDollarSaved: number
    totalActionsCompleted: number
    actionsThisWeek: number
  }
}

const labelMaps = {
  commuteType: {
    drive: { label: 'Drive alone', icon: '🚗' },
    transit: { label: 'Public transit', icon: '🚇' },
    bike_walk: { label: 'Bike or walk', icon: '🚴' },
    wfh: { label: 'Work from home', icon: '🏠' },
    mixed: { label: 'Mixed methods', icon: '🔄' },
  },
  dietPattern: {
    meat_most_days: { label: 'Meat most days', icon: '🥩' },
    chicken_fish: { label: 'Chicken & fish', icon: '🍗' },
    mostly_plant: { label: 'Mostly plant-based', icon: '🥗' },
    vegan_vegetarian: { label: 'Vegetarian/Vegan', icon: '🌱' },
  },
  livingSituation: {
    city_apartment: { label: 'City apartment', icon: '🏢' },
    urban_house: { label: 'Urban house', icon: '🏡' },
    suburbs: { label: 'Suburbs', icon: '🏘️' },
    rural: { label: 'Rural area', icon: '🌲' },
  },
  primaryBarrier: {
    time: { label: 'Not enough time', icon: '⏰' },
    cost: { label: 'Cost concerns', icon: '💰' },
    knowledge: { label: 'Lack of knowledge', icon: '🤔' },
    overwhelmed: { label: 'Feeling overwhelmed', icon: '😰' },
  },
  primaryMotivation: {
    planet: { label: 'Protect the planet', icon: '🌍' },
    money: { label: 'Save money', icon: '💵' },
    health: { label: 'Personal health', icon: '❤️' },
    community: { label: 'Inspire others', icon: '👥' },
  },
  category: {
    food: { label: 'Food & Diet', color: 'bg-amber-500' },
    transport: { label: 'Transportation', color: 'bg-blue-600' },
    energy: { label: 'Home Energy', color: 'bg-yellow-500' },
    shopping: { label: 'Shopping', color: 'bg-purple-600' },
    water: { label: 'Water Usage', color: 'bg-cyan-500' },
    waste: { label: 'Waste & Recycling', color: 'bg-orange-500' },
  },
}

export default function ProfilePage() {
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = localStorage.getItem('shift_session_id')
    if (!sessionId) {
      router.push('/onboarding')
      return
    }

    async function fetchProfile() {
      try {
        const response = await fetch('/api/get-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        if (response.status === 404) {
          localStorage.removeItem('shift_session_id')
          router.push('/onboarding')
          return
        }

        const result = await response.json()
        if (result.success) {
          setData(result.data)
        } else {
          setError('Failed to load profile')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const handleResetProfile = () => {
    if (confirm('This will delete all your data and progress. Are you sure?')) {
      localStorage.removeItem('shift_session_id')
      router.push('/onboarding')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-green-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f1a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Failed to load profile'}</p>
          <Link href="/dashboard" className="text-green-400 hover:text-green-300">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { profile, stats } = data
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#0f1a0f]">
      <Header />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-50 mb-1">{profile.city}</h1>
          <p className="text-green-400 text-sm">Member since {memberSince}</p>
        </motion.div>

        {/* AI Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30"
        >
          <h2 className="text-sm font-medium text-green-400 mb-2">Your Profile</h2>
          <p className="text-green-50 leading-relaxed">&quot;{profile.aiProfileSummary}&quot;</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-[#1a2e1a] rounded-xl p-4 border border-green-800/30 text-center">
            <div className="text-2xl font-bold text-green-50">{stats.totalActionsCompleted}</div>
            <div className="text-green-400 text-xs">Actions Completed</div>
          </div>
          <div className="bg-[#1a2e1a] rounded-xl p-4 border border-green-800/30 text-center">
            <div className="text-2xl font-bold text-green-50">{stats.longestStreak}</div>
            <div className="text-green-400 text-xs">Best Streak</div>
          </div>
          <div className="bg-[#1a2e1a] rounded-xl p-4 border border-green-800/30 text-center">
            <div className="text-2xl font-bold text-green-50">{formatCO2(stats.totalCo2SavedKg)}</div>
            <div className="text-green-400 text-xs">CO₂ Saved</div>
          </div>
          <div className="bg-[#1a2e1a] rounded-xl p-4 border border-green-800/30 text-center">
            <div className="text-2xl font-bold text-green-50">${stats.totalDollarSaved.toFixed(0)}</div>
            <div className="text-green-400 text-xs">Money Saved</div>
          </div>
        </motion.div>

        {/* Annual Footprint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30"
        >
          <h2 className="text-sm font-medium text-green-400 mb-3">Estimated Annual Footprint</h2>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-green-50">
              {formatCO2(profile.estimatedAnnualFootprintKg)}
            </span>
            <span className="text-green-400 text-sm mb-1">CO₂/year</span>
          </div>
          <p className="text-green-400/70 text-xs mt-2">US average: ~16 tonnes/year</p>
        </motion.div>

        {/* Top Impact Areas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30"
        >
          <h2 className="text-sm font-medium text-green-400 mb-3">Focus Areas</h2>
          <div className="flex flex-wrap gap-2">
            {profile.topImpactAreas.map((area) => {
              const info = labelMaps.category[area as keyof typeof labelMaps.category]
              return (
                <span
                  key={area}
                  className={`px-3 py-1.5 rounded-full text-white text-sm ${info?.color || 'bg-green-600'}`}
                >
                  {info?.label || area}
                </span>
              )
            })}
          </div>
        </motion.div>

        {/* Lifestyle Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30"
        >
          <h2 className="text-sm font-medium text-green-400 mb-4">Lifestyle</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-green-300 text-sm">Commute</span>
              <span className="text-green-50 flex items-center gap-2">
                {labelMaps.commuteType[profile.commuteType as keyof typeof labelMaps.commuteType]?.icon}
                {labelMaps.commuteType[profile.commuteType as keyof typeof labelMaps.commuteType]?.label}
              </span>
            </div>
            {profile.commuteDistanceMiles && (
              <div className="flex items-center justify-between">
                <span className="text-green-300 text-sm">Commute Distance</span>
                <span className="text-green-50">{profile.commuteDistanceMiles.toFixed(1)} miles</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-green-300 text-sm">Diet</span>
              <span className="text-green-50 flex items-center gap-2">
                {labelMaps.dietPattern[profile.dietPattern as keyof typeof labelMaps.dietPattern]?.icon}
                {labelMaps.dietPattern[profile.dietPattern as keyof typeof labelMaps.dietPattern]?.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-300 text-sm">Living</span>
              <span className="text-green-50 flex items-center gap-2">
                {labelMaps.livingSituation[profile.livingSituation as keyof typeof labelMaps.livingSituation]?.icon}
                {labelMaps.livingSituation[profile.livingSituation as keyof typeof labelMaps.livingSituation]?.label}
              </span>
            </div>
            {profile.electricityZone && (
              <div className="flex items-center justify-between">
                <span className="text-green-300 text-sm">Grid Zone</span>
                <span className="text-green-50">{profile.electricityZone}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Motivation & Barriers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30"
        >
          <h2 className="text-sm font-medium text-green-400 mb-4">What Drives You</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-green-300 text-sm">Motivation</span>
              <span className="text-green-50 flex items-center gap-2">
                {labelMaps.primaryMotivation[profile.primaryMotivation as keyof typeof labelMaps.primaryMotivation]?.icon}
                {labelMaps.primaryMotivation[profile.primaryMotivation as keyof typeof labelMaps.primaryMotivation]?.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-300 text-sm">Challenge</span>
              <span className="text-green-50 flex items-center gap-2">
                {labelMaps.primaryBarrier[profile.primaryBarrier as keyof typeof labelMaps.primaryBarrier]?.icon}
                {labelMaps.primaryBarrier[profile.primaryBarrier as keyof typeof labelMaps.primaryBarrier]?.label}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 pt-4"
        >
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors text-center"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/onboarding?retake=true"
            className="block w-full py-3 border border-green-600 text-green-400 hover:bg-green-600/10 font-medium rounded-xl transition-colors text-center"
          >
            Retake Quiz
          </Link>
          <button
            onClick={handleResetProfile}
            className="block w-full py-3 border border-red-600/50 text-red-400 hover:bg-red-600/10 font-medium rounded-xl transition-colors text-center"
          >
            Delete All Data
          </button>
        </motion.div>
      </main>
    </div>
  )
}
