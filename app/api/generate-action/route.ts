import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateWithFallback } from '@/lib/ai'
import { MicroActionOutputSchema } from '@/lib/schemas'
import { buildActionPrompt } from '@/lib/prompts/action-generator'
import { SUSTAINABILITY_COACH_SYSTEM_PROMPT } from '@/lib/prompts/system-prompt'
import { searchActions, getFallbackAction } from '@/lib/knowledge-base'
import type { UserProfile } from '@/types/user'
import type { ActionCategory } from '@/types/action'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body as { sessionId: string }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

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
      // Return existing action instead of generating a new one
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
      aiProfileSummary: user.ai_profile_summary || '',
      topImpactAreas: (user.top_impact_areas || ['food', 'energy', 'transport']) as ActionCategory[],
      estimatedAnnualFootprintKg: user.estimated_annual_footprint_kg || 16000,
      createdAt: user.created_at,
    }

    // Search for best candidate actions
    const candidates = searchActions(profile, recentActionIds, currentStreak, 5)

    if (candidates.length === 0) {
      // No matching candidates - use fallback
      const fallback = getFallbackAction(profile)
      if (!fallback) {
        return NextResponse.json(
          { error: 'No suitable actions found' },
          { status: 500 }
        )
      }
      candidates.push(fallback)
    }

    // Generate personalized action with AI
    let actionOutput
    try {
      actionOutput = await generateWithFallback(
        MicroActionOutputSchema,
        {
          system: SUSTAINABILITY_COACH_SYSTEM_PROMPT,
          user: buildActionPrompt(profile, candidates, currentStreak),
        },
        0.6 // Medium temperature for variety
      )
    } catch (aiError) {
      console.error('[generate-action] AI generation failed:', aiError)
      // Use first candidate as fallback
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
    })
  } catch (error) {
    console.error('[generate-action] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
