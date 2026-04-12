'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { QuestionCard } from '@/components/onboarding/QuestionCard'
import { ProfileReveal } from '@/components/onboarding/ProfileReveal'
import type { OnboardingAnswers } from '@/types/user'

// Question definitions with Fogg-informed framing
const QUESTIONS = [
  {
    id: 'commuteType',
    question: 'How do you usually get to work?',
    options: [
      { value: 'drive', label: 'I drive alone', description: 'Car, most days' },
      { value: 'transit', label: 'Public transit', description: 'Bus, subway, or train' },
      { value: 'bike_walk', label: 'Bike or walk', description: 'Active commute' },
      { value: 'wfh', label: 'Work from home', description: 'Remote most days' },
      { value: 'mixed', label: 'It varies', description: 'Mix of methods' },
    ],
  },
  {
    id: 'dietPattern',
    question: 'What does your typical diet look like?',
    options: [
      { value: 'meat_most_days', label: 'Meat most days', description: 'Beef, pork, or lamb regularly' },
      { value: 'chicken_fish', label: 'Mostly chicken & fish', description: 'Less red meat' },
      { value: 'mostly_plant', label: 'Mostly plant-based', description: 'Occasional meat or dairy' },
      { value: 'vegan_vegetarian', label: 'Vegan or vegetarian', description: 'No meat' },
    ],
  },
  {
    id: 'livingSituation',
    question: 'Where do you live?',
    options: [
      { value: 'city_apartment', label: 'City apartment', description: 'Urban, shared building' },
      { value: 'urban_house', label: 'House in the city', description: 'Urban single-family' },
      { value: 'suburbs', label: 'Suburbs', description: 'Suburban area' },
      { value: 'rural', label: 'Rural area', description: 'Countryside' },
    ],
  },
  {
    id: 'primaryBarrier',
    question: "What's your biggest challenge with sustainability?",
    options: [
      { value: 'time', label: "I don't have time", description: 'Too busy to think about it' },
      { value: 'cost', label: "It seems expensive", description: 'Worried about costs' },
      { value: 'knowledge', label: "I don't know what to do", description: 'Not sure where to start' },
      { value: 'overwhelmed', label: "It feels overwhelming", description: 'Too many options' },
    ],
  },
  {
    id: 'primaryMotivation',
    question: "What motivates you most?",
    options: [
      { value: 'planet', label: 'Helping the planet', description: 'Environmental impact' },
      { value: 'money', label: 'Saving money', description: 'Lower bills' },
      { value: 'health', label: 'My health', description: 'Personal wellbeing' },
      { value: 'community', label: 'Setting an example', description: 'Inspiring others' },
    ],
  },
]

type ProfileResponse = {
  topImpactAreas: string[]
  estimatedAnnualFootprintKg: number
  aiProfileSummary: string
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [sessionId, setSessionId] = useState<string>('')

  // Initialize or get session ID
  useEffect(() => {
    let storedSessionId = localStorage.getItem('shift_session_id')
    if (!storedSessionId) {
      storedSessionId = crypto.randomUUID()
      localStorage.setItem('shift_session_id', storedSessionId)
    }
    setSessionId(storedSessionId)
  }, [])

  const handleSelect = async (value: string) => {
    const questionId = QUESTIONS[currentStep].id as keyof OnboardingAnswers
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    if (currentStep < QUESTIONS.length - 1) {
      // Move to next question
      setCurrentStep(currentStep + 1)
    } else {
      // All questions answered - generate profile
      setIsLoading(true)

      try {
        // Get city from browser (simplified - in production use geolocation API)
        const city = 'New York' // Default for MVP

        const completeAnswers: OnboardingAnswers = {
          commuteType: newAnswers.commuteType as OnboardingAnswers['commuteType'],
          dietPattern: newAnswers.dietPattern as OnboardingAnswers['dietPattern'],
          livingSituation: newAnswers.livingSituation as OnboardingAnswers['livingSituation'],
          primaryBarrier: newAnswers.primaryBarrier as OnboardingAnswers['primaryBarrier'],
          primaryMotivation: newAnswers.primaryMotivation as OnboardingAnswers['primaryMotivation'],
          city,
        }

        const response = await fetch('/api/generate-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            answers: completeAnswers,
          }),
        })

        const data = await response.json()

        if (data.success) {
          setProfile({
            topImpactAreas: data.data.topImpactAreas,
            estimatedAnnualFootprintKg: data.data.estimatedAnnualFootprintKg,
            aiProfileSummary: data.data.aiProfileSummary,
          })
        } else {
          // Fallback profile on error
          setProfile({
            topImpactAreas: ['food', 'transport', 'energy'],
            estimatedAnnualFootprintKg: 15000,
            aiProfileSummary: "You're ready to start your sustainability journey. Let's focus on the changes that matter most to you.",
          })
        }
      } catch (error) {
        console.error('Profile generation error:', error)
        // Fallback profile
        setProfile({
          topImpactAreas: ['food', 'transport', 'energy'],
          estimatedAnnualFootprintKg: 15000,
          aiProfileSummary: "You're ready to start your sustainability journey. Let's focus on the changes that matter most to you.",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <OnboardingShell>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-green-50 mb-2">
            Analyzing your profile...
          </h2>
          <p className="text-green-400">
            Finding your biggest impact opportunities
          </p>
        </div>
      </OnboardingShell>
    )
  }

  // Profile reveal
  if (profile) {
    return (
      <OnboardingShell>
        <ProfileReveal profile={profile} />
      </OnboardingShell>
    )
  }

  // Questions
  return (
    <OnboardingShell>
      <AnimatePresence mode="wait">
        <QuestionCard
          key={currentStep}
          question={QUESTIONS[currentStep].question}
          options={QUESTIONS[currentStep].options}
          onSelect={handleSelect}
          currentStep={currentStep + 1}
          totalSteps={QUESTIONS.length}
        />
      </AnimatePresence>
    </OnboardingShell>
  )
}
