import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { supabase } from '@/lib/supabase'
import { generateWithFallback } from '@/lib/ai'
import { MicroActionOutputSchema } from '@/lib/schemas'
import { buildActionPrompt } from '@/lib/prompts/action-generator'
import { SUSTAINABILITY_COACH_SYSTEM_PROMPT } from '@/lib/prompts/system-prompt'
import { searchActions, getFallbackAction, getActionById } from '@/lib/knowledge-base'
import { getWeather } from '@/lib/open-meteo'
import { getGridIntensity } from '@/lib/electricity-maps'
import type { UserProfile } from '@/types/user'
import type { ActionCategory } from '@/types/action'

// Input validation schema
const InputSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const { sessionId } = InputSchema.parse(body)

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found. Complete onboarding first.' },
        { status: 404 }
      )
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Check if action already exists for today (idempotency)
    const { data: existingAction } = await supabase
      .from('actions')
      .select('*')
      .eq('user_id', user.id)
      .eq('action_date', today)
      .single()

    if (existingAction) {
      return NextResponse.json({
        success: true,
        data: {
          id: existingAction.id,
          category: existingAction.category,
          title: existingAction.title,
          description: existingAction.description,
          anchorHabit: existingAction.anchor_habit,
          co2SavingsKg: existingAction.co2_savings_kg,
          dollarSavings: existingAction.dollar_savings,
          timeRequiredMinutes: existingAction.time_required_minutes,
          difficultyLevel: existingAction.difficulty_level,
          behavioralFrame: existingAction.behavioral_frame,
          equivalencyLabel: existingAction.equivalency_label,
          completed: existingAction.completed,
          actionDate: existingAction.action_date,
        },
        isExisting: true,
      })
    }

    // Get user's streak
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .single()

    const currentStreak = streakData?.current_streak || 0

    // Get recent action IDs to avoid repetition
    const { data: recentActions } = await supabase
      .from('actions')
      .select('id, category, title')
      .eq('user_id', user.id)
      .order('action_date', { ascending: false })
      .limit(7)

    const recentActionIds = recentActions?.map(a => a.id) || []

    // Fetch weather data (cached)
    let weatherData: { temperature: number; description: string } | undefined
    if (user.lat && user.lng) {
      try {
        weatherData = await getWeather(user.lat, user.lng)
      } catch (weatherError) {
        console.error('[generate-action] Weather fetch error:', weatherError)
      }
    }

    // Fetch grid intensity (cached) and check renewable percentage
    let gridData: { renewablePercent: number; carbonIntensity: number } | undefined
    let biasEnergyActions = false
    if (user.lat && user.lng) {
      try {
        gridData = await getGridIntensity(user.lat, user.lng)
        // If grid is >50% renewable, bias toward energy actions
        if (gridData.renewablePercent > 50) {
          biasEnergyActions = true
        }
      } catch (gridError) {
        console.error('[generate-action] Grid intensity error:', gridError)
      }
    }

    // Build user profile for search
    const profile: UserProfile = {
      id: user.id,
      sessionId: user.session_id,
      city: user.city || '',
      commuteType: user.commute_type,
      commuteDistanceMiles: user.commute_distance_miles,
      dietPattern: user.diet_pattern,
      livingSituation: user.living_situation,
      primaryBarrier: user.primary_barrier,
      primaryMotivation: user.primary_motivation,
      // Goal-setting fields
      goalDuration: user.goal_duration || 14,
      goalStartDate: user.goal_start_date || new Date().toISOString().split('T')[0],
      goalEndDate: user.goal_end_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      actionFrequency: user.action_frequency || 'daily',
      preferredTime: user.preferred_time || 'morning',
      difficultyPreference: user.difficulty_preference || 'start_easy',
      focusAreas: (user.focus_areas || ['food', 'energy', 'transport']) as ActionCategory[],
      // AI-generated fields
      aiProfileSummary: user.ai_profile_summary || '',
      topImpactAreas: (user.top_impact_areas || ['food', 'energy', 'transport']) as ActionCategory[],
      estimatedAnnualFootprintKg: user.estimated_annual_footprint_kg || 16000,
      createdAt: user.created_at,
    }

    // If grid is highly renewable, add 'energy' to top impact areas for biasing
    if (biasEnergyActions && !profile.topImpactAreas.includes('energy')) {
      profile.topImpactAreas = ['energy', ...profile.topImpactAreas.slice(0, 2)]
    }

    // Search for best candidate actions
    const candidates = searchActions(profile, recentActionIds, currentStreak, 5)

    if (candidates.length === 0) {
      const fallback = getFallbackAction(profile)
      if (!fallback) {
        return NextResponse.json(
          { error: 'No suitable actions found' },
          { status: 500 }
        )
      }
      candidates.push(fallback)
    }

    // Build enhanced prompt with weather, grid intensity, and commute CO2 data
    let enhancedPromptContext = ''
    if (weatherData) {
      enhancedPromptContext += `\nWEATHER: ${weatherData.temperature}F, ${weatherData.description}`
    }
    if (gridData) {
      enhancedPromptContext += `\nGRID: ${gridData.renewablePercent}% renewable, ${gridData.carbonIntensity} gCO2/kWh`
      if (biasEnergyActions) {
        enhancedPromptContext += ' (great day for energy savings - grid is clean!)'
      }
    }
    if (user.car_co2_kg_per_trip && user.transit_co2_kg_per_trip) {
      enhancedPromptContext += `\nCOMMUTE CO2: Car ${user.car_co2_kg_per_trip.toFixed(2)} kg/trip, Transit ${user.transit_co2_kg_per_trip.toFixed(2)} kg/trip`
      if (user.daily_savings_if_switched) {
        enhancedPromptContext += `, Potential daily savings: ${user.daily_savings_if_switched.toFixed(2)} kg`
      }
    }

    // Generate personalized action with AI
    let actionOutput
    try {
      const basePrompt = buildActionPrompt(profile, candidates, currentStreak, weatherData)
      const fullPrompt = basePrompt + enhancedPromptContext

      actionOutput = await generateWithFallback(
        MicroActionOutputSchema,
        {
          system: SUSTAINABILITY_COACH_SYSTEM_PROMPT,
          user: fullPrompt,
        },
        0.6
      )
    } catch (aiError) {
      console.error('[generate-action] AI generation failed:', aiError)

      // Try static fallback from knowledge base
      const staticFallback = getActionById(candidates[0]?.id || 'food-001')
      if (staticFallback) {
        actionOutput = {
          title: staticFallback.title,
          description: staticFallback.descriptionTemplate
            .replace('{anchor}', 'finish your morning routine')
            .replace('{co2}', staticFallback.co2SavingsKgPerOccurrence.toString())
            .replace('{dollars}', staticFallback.dollarSavingsPerOccurrence.toFixed(2)),
          anchorHabit: 'After you finish your morning routine',
          co2SavingsKg: staticFallback.co2SavingsKgPerOccurrence,
          dollarSavings: staticFallback.dollarSavingsPerOccurrence,
          timeRequiredMinutes: staticFallback.timeRequiredMinutes,
          difficultyLevel: staticFallback.difficulty,
          behavioralFrame: staticFallback.behavioralFramePrimary,
          equivalencyLabel: staticFallback.equivalencyLabel,
          category: staticFallback.category,
        }
      } else {
        // Last resort fallback
        const fallbackCandidate = candidates[0]
        actionOutput = {
          title: fallbackCandidate.title,
          description: fallbackCandidate.descriptionTemplate
            .replace('{anchor}', 'finish your morning routine')
            .replace('{co2}', fallbackCandidate.co2SavingsKgPerOccurrence.toString())
            .replace('{dollars}', fallbackCandidate.dollarSavingsPerOccurrence.toFixed(2)),
          anchorHabit: 'After you finish your morning routine',
          co2SavingsKg: fallbackCandidate.co2SavingsKgPerOccurrence,
          dollarSavings: fallbackCandidate.dollarSavingsPerOccurrence,
          timeRequiredMinutes: fallbackCandidate.timeRequiredMinutes,
          difficultyLevel: fallbackCandidate.difficulty,
          behavioralFrame: fallbackCandidate.behavioralFramePrimary,
          equivalencyLabel: fallbackCandidate.equivalencyLabel,
          category: fallbackCandidate.category,
        }
      }
    }

    // Save action to database
    const { data: newAction, error: insertError } = await supabase
      .from('actions')
      .insert({
        user_id: user.id,
        action_date: today,
        category: actionOutput.category,
        title: actionOutput.title,
        description: actionOutput.description,
        anchor_habit: actionOutput.anchorHabit,
        co2_savings_kg: actionOutput.co2SavingsKg,
        dollar_savings: actionOutput.dollarSavings,
        time_required_minutes: actionOutput.timeRequiredMinutes,
        difficulty_level: actionOutput.difficultyLevel,
        behavioral_frame: actionOutput.behavioralFrame,
        equivalency_label: actionOutput.equivalencyLabel,
        completed: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[generate-action] Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save action' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newAction.id,
        category: newAction.category,
        title: newAction.title,
        description: newAction.description,
        anchorHabit: newAction.anchor_habit,
        co2SavingsKg: newAction.co2_savings_kg,
        dollarSavings: newAction.dollar_savings,
        timeRequiredMinutes: newAction.time_required_minutes,
        difficultyLevel: newAction.difficulty_level,
        behavioralFrame: newAction.behavioral_frame,
        equivalencyLabel: newAction.equivalency_label,
        completed: newAction.completed,
        actionDate: newAction.action_date,
      },
      isExisting: false,
      context: {
        weather: weatherData,
        gridRenewablePercent: gridData?.renewablePercent,
      },
    })
  } catch (error) {
    // Handle Zod validation errors as 400
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('[generate-action] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
