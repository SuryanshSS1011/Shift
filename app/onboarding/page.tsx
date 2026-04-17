'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { QuestionCard } from '@/components/onboarding/QuestionCard'
import { MultiSelectCard } from '@/components/onboarding/MultiSelectCard'
import { GoalDurationCard } from '@/components/onboarding/GoalDurationCard'
import { ActionFrequencyCard } from '@/components/onboarding/ActionFrequencyCard'
import { AddressCapture } from '@/components/onboarding/AddressCapture'
import { LoadingScreen } from '@/components/onboarding/LoadingScreen'
import { ProfileReveal } from '@/components/onboarding/ProfileReveal'
import type { OnboardingAnswers, GoalDuration, ActionFrequency } from '@/types/user'
import { toast } from 'sonner'
import type { ActionCategory } from '@/types/action'

// Lifestyle questions (steps 1-5)
const LIFESTYLE_QUESTIONS = [
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

// Goal-setting questions (steps 8-9, after frequency slider)
const GOAL_QUESTIONS = [
  {
    id: 'preferredTime',
    question: 'When should we remind you?',
    subtitle: 'Best time to receive your daily action',
    options: [
      { value: 'morning', label: 'Morning', emoji: '🌅', description: '6am - 10am' },
      { value: 'afternoon', label: 'Afternoon', emoji: '☀️', description: '12pm - 4pm' },
      { value: 'evening', label: 'Evening', emoji: '🌙', description: '6pm - 9pm' },
    ],
  },
  {
    id: 'difficultyPreference',
    question: 'How challenging should we start?',
    subtitle: 'We\'ll adjust based on your progress',
    options: [
      { value: 'start_easy', label: 'Start easy', emoji: '🌱', description: 'Build confidence first' },
      { value: 'moderate', label: 'Moderate', emoji: '🌿', description: 'Balanced challenge' },
      { value: 'challenge_me', label: 'Challenge me', emoji: '🌳', description: 'Push my limits' },
    ],
  },
]

// Focus area options for multi-select
const FOCUS_AREA_OPTIONS = [
  { value: 'food', label: 'Food', emoji: '🍽️', description: 'Diet & eating habits' },
  { value: 'transport', label: 'Transport', emoji: '🚗', description: 'How you get around' },
  { value: 'energy', label: 'Energy', emoji: '⚡', description: 'Home energy use' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️', description: 'What you buy' },
  { value: 'water', label: 'Water', emoji: '💧', description: 'Water consumption' },
  { value: 'waste', label: 'Waste', emoji: '♻️', description: 'Reduce & recycle' },
]

type ProfileResponse = {
  topImpactAreas: string[]
  estimatedAnnualFootprintKg: number
  aiProfileSummary: string
  actionFrequency?: ActionFrequency
}

// Flow states for different sections
type FlowState =
  | 'checking'
  | 'lifestyle'         // Questions 1-5
  | 'goal_duration'     // Question 6 - special component
  | 'action_frequency'  // Question 7 - frequency slider
  | 'goals'             // Questions 8-9
  | 'focus_areas'       // Question 10 - multi-select
  | 'address'           // Question 11
  | 'loading'
  | 'profile'

// Total steps: 5 lifestyle + 1 goal duration + 1 frequency + 2 goal questions + 1 focus areas + 1 address = 11
const TOTAL_STEPS = 11

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRetake = searchParams.get('retake') === 'true'

  const [currentStep, setCurrentStep] = useState(0) // 0-indexed step counter
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
      window.location.href = '/dashboard'
      return
    }

    if (isRetake && storedSessionId) {
      // User is retaking - keep the existing session ID for now
      // We'll decide whether to reuse or create new when submitting
      setExistingSessionId(storedSessionId)
      // Don't create new session yet - wait until profile submission
    }

    // Start the quiz flow with lifestyle questions
    setFlowState('lifestyle')
  }, [router, isRetake])

  // Helper to get the current display step (1-indexed for UI)
  const getDisplayStep = (): number => {
    switch (flowState) {
      case 'lifestyle':
        return currentStep + 1 // Steps 1-5
      case 'goal_duration':
        return 6
      case 'action_frequency':
        return 7
      case 'goals':
        return 8 + currentStep // Steps 8-9
      case 'focus_areas':
        return 10
      case 'address':
        return 11
      default:
        return 1
    }
  }

  // Handle back navigation
  const handleBack = useCallback(() => {
    switch (flowState) {
      case 'lifestyle':
        if (currentStep > 0) {
          setCurrentStep(currentStep - 1)
        }
        break
      case 'goal_duration':
        setCurrentStep(LIFESTYLE_QUESTIONS.length - 1)
        setFlowState('lifestyle')
        break
      case 'action_frequency':
        setFlowState('goal_duration')
        break
      case 'goals':
        if (currentStep > 0) {
          setCurrentStep(currentStep - 1)
        } else {
          setFlowState('action_frequency')
        }
        break
      case 'focus_areas':
        setCurrentStep(GOAL_QUESTIONS.length - 1)
        setFlowState('goals')
        break
      case 'address':
        setFlowState('focus_areas')
        break
    }
  }, [flowState, currentStep])

  // Check if back is available
  const canGoBack =
    flowState === 'lifestyle' ? currentStep > 0 :
    ['goal_duration', 'action_frequency', 'goals', 'focus_areas', 'address'].includes(flowState)

  // Handle lifestyle question selection (steps 1-5)
  const handleLifestyleSelect = (value: string) => {
    const questionId = LIFESTYLE_QUESTIONS[currentStep].id as keyof OnboardingAnswers
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    if (currentStep < LIFESTYLE_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Move to goal duration (step 6)
      setFlowState('goal_duration')
    }
  }

  // Handle goal duration selection (step 6)
  const handleGoalDurationSelect = (duration: GoalDuration) => {
    setAnswers({ ...answers, goalDuration: duration })
    setFlowState('action_frequency')
  }

  // Handle action frequency selection (step 7)
  const handleActionFrequencySelect = (frequency: ActionFrequency) => {
    setAnswers({ ...answers, actionFrequency: frequency })
    setCurrentStep(0) // Reset for goals section
    setFlowState('goals')
  }

  // Handle goal question selection (steps 7-9)
  const handleGoalSelect = (value: string) => {
    const questionId = GOAL_QUESTIONS[currentStep].id as keyof OnboardingAnswers
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    if (currentStep < GOAL_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Move to focus areas (step 10)
      setFlowState('focus_areas')
    }
  }

  // Handle focus area selection (step 10)
  const handleFocusAreasSelect = (areas: string[]) => {
    setAnswers({ ...answers, focusAreas: areas as ActionCategory[] })
    setFlowState('address')
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
    // Don't set localStorage here - wait until API succeeds to avoid race condition
    // where user navigates to dashboard before profile is saved to database
    setSessionId(newSessionId)

    const completeAnswers: OnboardingAnswers = {
      // Lifestyle questions
      commuteType: answers.commuteType as OnboardingAnswers['commuteType'],
      dietPattern: answers.dietPattern as OnboardingAnswers['dietPattern'],
      livingSituation: answers.livingSituation as OnboardingAnswers['livingSituation'],
      primaryBarrier: answers.primaryBarrier as OnboardingAnswers['primaryBarrier'],
      primaryMotivation: answers.primaryMotivation as OnboardingAnswers['primaryMotivation'],
      // Goal-setting questions
      goalDuration: answers.goalDuration as GoalDuration,
      actionFrequency: answers.actionFrequency as OnboardingAnswers['actionFrequency'],
      preferredTime: answers.preferredTime as OnboardingAnswers['preferredTime'],
      difficultyPreference: answers.difficultyPreference as OnboardingAnswers['difficultyPreference'],
      focusAreas: answers.focusAreas as ActionCategory[],
      // Location
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
        // Only save sessionId to localStorage AFTER profile is successfully saved to database
        // This prevents the dashboard from redirecting back when user doesn't exist in DB
        localStorage.setItem('shift_session_id', newSessionId)
        setProfile({
          topImpactAreas: data.data.topImpactAreas,
          estimatedAnnualFootprintKg: data.data.estimatedAnnualFootprintKg,
          aiProfileSummary: data.data.aiProfileSummary,
          actionFrequency: completeAnswers.actionFrequency,
        })
        setFlowState('profile')
      } else {
        // API returned error - profile not saved to database
        // Don't set localStorage - can't proceed to dashboard
        console.error('Profile generation API error:', data.error)
        toast.error('We couldn\'t save your profile. Please try again.')
        setCurrentStep(0)
        setFlowState('lifestyle')
      }
    } catch (error) {
      console.error('Profile generation error:', error)
      // Network/fetch error - profile not saved to database
      // Don't set localStorage - can't proceed to dashboard
      toast.error('Please check your internet connection and try again.')
      setCurrentStep(0)
      setFlowState('lifestyle')
    }
  }

  const displayStep = getDisplayStep()

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

  // Address capture (step 11)
  if (flowState === 'address') {
    return (
      <OnboardingShell showBackButton onBack={handleBack}>
        <AnimatePresence mode="wait">
          <AddressCapture key="address" onSubmit={handleAddressSubmit} />
        </AnimatePresence>
      </OnboardingShell>
    )
  }

  // Focus areas multi-select (step 10)
  if (flowState === 'focus_areas') {
    return (
      <OnboardingShell showBackButton onBack={handleBack}>
        <AnimatePresence mode="wait">
          <MultiSelectCard
            key="focus_areas"
            question="What areas interest you most?"
            subtitle="We'll prioritize actions in these categories"
            options={FOCUS_AREA_OPTIONS}
            onSubmit={handleFocusAreasSelect}
            currentStep={displayStep}
            totalSteps={TOTAL_STEPS}
            minSelections={2}
            maxSelections={3}
          />
        </AnimatePresence>
      </OnboardingShell>
    )
  }

  // Goal questions (steps 7-9)
  if (flowState === 'goals') {
    return (
      <OnboardingShell showBackButton onBack={handleBack}>
        <AnimatePresence mode="wait">
          <QuestionCard
            key={`goal-${currentStep}`}
            question={GOAL_QUESTIONS[currentStep].question}
            subtitle={GOAL_QUESTIONS[currentStep].subtitle}
            options={GOAL_QUESTIONS[currentStep].options}
            onSelect={handleGoalSelect}
            currentStep={displayStep}
            totalSteps={TOTAL_STEPS}
          />
        </AnimatePresence>
      </OnboardingShell>
    )
  }

  // Goal duration (step 6)
  if (flowState === 'goal_duration') {
    return (
      <OnboardingShell showBackButton onBack={handleBack}>
        <AnimatePresence mode="wait">
          <GoalDurationCard
            key="goal_duration"
            onSubmit={handleGoalDurationSelect}
            currentStep={displayStep}
            totalSteps={TOTAL_STEPS}
          />
        </AnimatePresence>
      </OnboardingShell>
    )
  }

  // Action frequency (step 7)
  if (flowState === 'action_frequency') {
    return (
      <OnboardingShell showBackButton onBack={handleBack}>
        <AnimatePresence mode="wait">
          <ActionFrequencyCard
            key="action_frequency"
            onSubmit={handleActionFrequencySelect}
            currentStep={displayStep}
            totalSteps={TOTAL_STEPS}
          />
        </AnimatePresence>
      </OnboardingShell>
    )
  }

  // Lifestyle questions (steps 1-5)
  return (
    <OnboardingShell showBackButton={canGoBack} onBack={handleBack}>
      <AnimatePresence mode="wait">
        <QuestionCard
          key={`lifestyle-${currentStep}`}
          question={LIFESTYLE_QUESTIONS[currentStep].question}
          subtitle={LIFESTYLE_QUESTIONS[currentStep].subtitle}
          options={LIFESTYLE_QUESTIONS[currentStep].options}
          onSelect={handleLifestyleSelect}
          currentStep={displayStep}
          totalSteps={TOTAL_STEPS}
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
