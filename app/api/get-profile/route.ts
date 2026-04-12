import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

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
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get streak data
    const { data: streak } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', user.id)
      .single()

    // Get impact totals
    const { data: totals } = await supabase
      .from('impact_totals')
      .select('total_co2_saved_kg, total_dollar_saved, total_actions_completed')
      .eq('user_id', user.id)
      .single()

    // Get recent actions count
    const { count: actionsThisWeek } = await supabase
      .from('actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('action_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: user.id,
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
          electricityZone: user.electricity_zone,
          createdAt: user.created_at,
        },
        stats: {
          currentStreak: streak?.current_streak || 0,
          longestStreak: streak?.longest_streak || 0,
          totalCo2SavedKg: totals?.total_co2_saved_kg || 0,
          totalDollarSaved: totals?.total_dollar_saved || 0,
          totalActionsCompleted: totals?.total_actions_completed || 0,
          actionsThisWeek: actionsThisWeek || 0,
        },
      },
    })
  } catch (error) {
    console.error('[get-profile] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
