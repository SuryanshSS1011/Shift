'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { QuestionCard } from '@/components/onboarding/QuestionCard'
import { AddressCapture } from '@/components/onboarding/AddressCapture'
import { LoadingScreen } from '@/components/onboarding/LoadingScreen'
import { ProfileReveal } from '@/components/onboarding/ProfileReveal'
import type { OnboardingAnswers } from '@/types/user'

// 5 multiple-choice questions with emojis and descriptions
const QUESTIONS = [
  {
    id: 'commuteType',
    question: 'How do you usually get around?',
    subtitle: 'Your most common way to commute',
    options: [
      { value: 'drive', label: 'Drive alone', emoji: '🚗', description: 'Car, most days' },
      { value: 'transit', label: 'Bus or subway', emoji: '🚇', description: 'Public transit' },
      { value: 'bike_walk', label: 'Bike or walk', emoji: '🚴', description: 'Active commute' },
      { value: 'wfh', label: 'Work from home', emoji: '🏠', description: 'Remote most days' },
      { value: 'mixed', label: 'Mix of methods', emoji: '🔄', description: 'It varies' },
    ],
  },
  {
    id: 'dietPattern',
    question: 'How would you describe your diet?',
    subtitle: 'What you eat on a typical week',
    options: [
      { value: 'meat_most_days', label: 'Meat most days', emoji: '🥩', description: 'Beef, pork, or lamb regularly' },
      { value: 'chicken_fish', label: 'Chicken and fish', emoji: '🍗', description: 'Less red meat' },
      { value: 'mostly_plant', label: 'Mostly plant-based', emoji: '🥗', description: 'Occasional meat or dairy' },
      { value: 'vegan_vegetarian', label: 'Vegetarian or vegan', emoji: '🌱', description: 'No meat' },
    ],
  },
  {
    id: 'livingSituation',
    question: 'Where do you live?',
    subtitle: 'Your current home situation',
    options: [
      { value: 'city_apartment', label: 'City apartment', emoji: '🏢', description: 'Urban, shared building' },
      { value: 'urban_house', label: 'Urban house', emoji: '🏡', description: 'Urban single-family' },
      { value: 'suburbs', label: 'Suburbs', emoji: '🏘️', description: 'Suburban area' },
      { value: 'rural', label: 'Rural area', emoji: '🌲', description: 'Countryside' },
    ],
  },
  {
    id: 'primaryBarrier',
    question: "What's stopped you from being more sustainable?",
    subtitle: 'The biggest challenge you face',
    options: [
      { value: 'time', label: 'Not enough time', emoji: '⏰', description: 'Too busy to think about it' },
      { value: 'cost', label: 'Feels expensive', emoji: '💰', description: 'Worried about costs' },
      { value: 'knowledge', label: "Don't know where to start", emoji: '🤔', description: 'Not sure what to do' },
      { value: 'overwhelmed', label: 'Feels overwhelming', emoji: '😰', description: 'Too many options' },
    ],
  },
  {
    id: 'primaryMotivation',
    question: 'What matters most to you?',
    subtitle: 'Your primary motivation',
    options: [
      { value: 'planet', label: 'The planet', emoji: '🌍', description: 'Environmental impact' },
      { value: 'money', label: 'Saving money', emoji: '💵', description: 'Lower bills' },
      { value: 'health', label: 'My health', emoji: '❤️', description: 'Personal wellbeing' },
      { value: 'community', label: 'Being part of something', emoji: '👥', description: 'Inspiring others' },
    ],
  },
]

type ProfileResponse = {
  topImpactAreas: string[]
  estimatedAnnualFootprintKg: number
  aiProfileSummary: string
}

type FlowState = 'checking' | 'questions' | 'address' | 'loading' | 'profile'

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRetake = searchParams.get('retake') === 'true'

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({})
  const [flowState, setFlowState] = useState<FlowState>('checking')
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [existingSessionId, setExistingSessionId] = useState<string | null>(null)

  // Check if user already has a profile and handle accordingly
  useEffect(() => {
    const storedSessionId = localStorage.getItem('shift_session_id')

    if (storedSessionId && !isRetake) {
      // User has session and didn't explicitly choose to retake - redirect to dashboard
      router.replace('/dashboard')
      return
    }

    if (isRetake && storedSessionId) {
      // User is retaking - keep the existing session ID for now
      // We'll decide whether to reuse or create new when submitting
      setExistingSessionId(storedSessionId)
      // Don't create new session yet - wait until profile submission
    }

    // Start the quiz flow
    setFlowState('questions')
  }, [router, isRetake])

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (flowState === 'address') {
      // Go back to last question
      setCurrentStep(QUESTIONS.length - 1)
      setFlowState('questions')
    } else if (currentStep > 0) {
      // Go to previous question
      setCurrentStep(currentStep - 1)
    }
  }, [flowState, currentStep])

  // Check if back is available
  const canGoBack = flowState === 'questions' ? currentStep > 0 : flowState === 'address'

  const handleQuestionSelect = (value: string) => {
    const questionId = QUESTIONS[currentStep].id as keyof OnboardingAnswers
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Move to address capture (step 6)
      setCurrentStep(QUESTIONS.length)
      setFlowState('address')
    }
  }

  const handleAddressSubmit = async (addressData: {
    city: string
    homeAddress?: string
    workAddress?: string
  }) => {
    setFlowState('loading')

    // Generate session ID now (at submission time, not at page load)
    // For retake: create new session (old profile stays in DB but is orphaned)
    // For new user: create new session
    const newSessionId = crypto.randomUUID()
    localStorage.setItem('shift_session_id', newSessionId)
    setSessionId(newSessionId)

    const completeAnswers: OnboardingAnswers = {
      commuteType: answers.commuteType as OnboardingAnswers['commuteType'],
      dietPattern: answers.dietPattern as OnboardingAnswers['dietPattern'],
      livingSituation: answers.livingSituation as OnboardingAnswers['livingSituation'],
      primaryBarrier: answers.primaryBarrier as OnboardingAnswers['primaryBarrier'],
      primaryMotivation: answers.primaryMotivation as OnboardingAnswers['primaryMotivation'],
      city: addressData.city,
      homeAddress: addressData.homeAddress,
      workAddress: addressData.workAddress,
    }

    try {
      const response = await fetch('/api/generate-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newSessionId,
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
          aiProfileSummary:
            "You're ready to start your sustainability journey. Let's focus on the changes that matter most to you.",
        })
      }
    } catch (error) {
      console.error('Profile generation error:', error)
      // Fallback profile
      setProfile({
        topImpactAreas: ['food', 'transport', 'energy'],
        estimatedAnnualFootprintKg: 15000,
        aiProfileSummary:
          "You're ready to start your sustainability journey. Let's focus on the changes that matter most to you.",
      })
    } finally {
      setFlowState('profile')
    }
  }

  // Total steps: 5 questions + 1 address = 6
  const totalSteps = 6

  // Checking state (redirecting or initializing)
  if (flowState === 'checking') {
    return (
      <div className="min-h-screen bg-[#0f1a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-green-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Loading state (generating profile)
  if (flowState === 'loading') {
    return (
      <OnboardingShell>
        <LoadingScreen />
      </OnboardingShell>
    )
  }

  // Profile reveal
  if (flowState === 'profile' && profile) {
    return (
      <OnboardingShell>
        <ProfileReveal profile={profile} />
      </OnboardingShell>
    )
  }

  // Address capture (step 6)
  if (flowState === 'address') {
    return (
      <OnboardingShell showBackButton onBack={handleBack}>
        <AnimatePresence mode="wait">
          <AddressCapture key="address" onSubmit={handleAddressSubmit} />
        </AnimatePresence>
      </OnboardingShell>
    )
  }

  // Questions (steps 1-5)
  return (
    <OnboardingShell showBackButton={canGoBack} onBack={handleBack}>
      <AnimatePresence mode="wait">
        <QuestionCard
          key={currentStep}
          question={QUESTIONS[currentStep].question}
          subtitle={QUESTIONS[currentStep].subtitle}
          options={QUESTIONS[currentStep].options}
          onSelect={handleQuestionSelect}
          currentStep={currentStep + 1}
          totalSteps={totalSteps}
        />
      </AnimatePresence>
    </OnboardingShell>
  )
}

// Wrap in Suspense for useSearchParams
export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f1a0f] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-green-400">Loading...</p>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}
