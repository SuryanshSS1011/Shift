import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const requestSchema = z.object({
  sessionId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { sessionId } = parsed.data

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all actions
    const { data: actions, error: actionsError } = await supabase
      .from('actions')
      .select('*')
      .eq('user_id', user.id)
      .order('action_date', { ascending: false })

    if (actionsError) {
      console.error('[export-data] Actions query error:', actionsError)
    }

    // Get streak data
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (streakError) {
      console.error('[export-data] Streak query error:', streakError)
    }

    // Get impact totals
    const { data: impact, error: impactError } = await supabase
      .from('impact_totals')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (impactError) {
      console.error('[export-data] Impact query error:', impactError)
    }

    // Build export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        city: user.city,
        commuteType: user.commute_type,
        commuteDistanceMiles: user.commute_distance_miles,
        dietPattern: user.diet_pattern,
        livingSituation: user.living_situation,
        primaryBarrier: user.primary_barrier,
        primaryMotivation: user.primary_motivation,
        aiProfileSummary: user.ai_profile_summary,
        topImpactAreas: user.top_impact_areas,
        estimatedAnnualFootprintKg: user.estimated_annual_footprint_kg,
        createdAt: user.created_at,
      },
      streak: streak
        ? {
            currentStreak: streak.current_streak,
            longestStreak: streak.longest_streak,
            lastActionDate: streak.last_action_date,
          }
        : null,
      impact: impact
        ? {
            totalCo2SavedKg: impact.total_co2_saved_kg,
            totalDollarSaved: impact.total_dollar_saved,
            totalActionsCompleted: impact.total_actions_completed,
          }
        : null,
      actions: (actions || []).map((action) => ({
        date: action.action_date,
        category: action.category,
        title: action.title,
        description: action.description,
        co2SavingsKg: action.co2_savings_kg,
        dollarSavings: action.dollar_savings,
        completed: action.completed,
        completedAt: action.completed_at,
      })),
    }

    // Return as JSON file download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="shift-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('[export-data] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
