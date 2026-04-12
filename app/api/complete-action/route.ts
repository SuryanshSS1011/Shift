import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { supabase } from '@/lib/supabase'
import { computeLevel } from '@/lib/points'

// Input validation schema
const InputSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  actionId: z.string().uuid('actionId must be a valid UUID'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const { sessionId, actionId } = InputSchema.parse(body)

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the action and verify ownership
    const { data: action, error: actionError } = await supabase
      .from('actions')
      .select('*')
      .eq('id', actionId)
      .eq('user_id', user.id)
      .single()

    if (actionError || !action) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      )
    }

    if (action.completed) {
      return NextResponse.json(
        { error: 'Action already completed' },
        { status: 400 }
      )
    }

    // Mark action as completed
    const completedAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('actions')
      .update({
        completed: true,
        completed_at: completedAt,
      })
      .eq('id', actionId)

    if (updateError) {
      console.error('[complete-action] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete action' },
        { status: 500 }
      )
    }

    // Update streak using RPC function
    const { error: streakError } = await supabase.rpc('update_streak', {
      p_user_id: user.id,
    })

    if (streakError) {
      console.error('[complete-action] Streak update error:', streakError)
      // Don't fail the request - streak update is secondary
    }

    // Update impact totals including points
    const { data: currentTotals } = await supabase
      .from('impact_totals')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const actionPoints = action.points || 0

    if (currentTotals) {
      const { error: totalsError } = await supabase
        .from('impact_totals')
        .update({
          total_co2_saved_kg: (currentTotals.total_co2_saved_kg || 0) + (action.co2_savings_kg || 0),
          total_dollar_saved: (currentTotals.total_dollar_saved || 0) + (action.dollar_savings || 0),
          total_actions_completed: (currentTotals.total_actions_completed || 0) + 1,
          total_points: (currentTotals.total_points || 0) + actionPoints,
        })
        .eq('user_id', user.id)

      if (totalsError) {
        console.error('[complete-action] Totals update error:', totalsError)
      }
    }

    // Update category streak
    const actionCategory = action.category
    const actionDate = new Date().toISOString().split('T')[0]

    const { data: categoryStreak } = await supabase
      .from('category_streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', actionCategory)
      .single()

    if (categoryStreak) {
      // Check if last action was yesterday or today
      const lastDate = categoryStreak.last_action_date
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      let newCategoryStreak = categoryStreak.current_streak
      if (lastDate === yesterdayStr) {
        newCategoryStreak = categoryStreak.current_streak + 1
      } else if (lastDate !== actionDate) {
        newCategoryStreak = 1 // Reset streak
      }

      await supabase
        .from('category_streaks')
        .update({
          current_streak: newCategoryStreak,
          longest_streak: Math.max(categoryStreak.longest_streak, newCategoryStreak),
          last_action_date: actionDate,
        })
        .eq('user_id', user.id)
        .eq('category', actionCategory)
    } else {
      // Create new category streak
      await supabase
        .from('category_streaks')
        .insert({
          user_id: user.id,
          category: actionCategory,
          current_streak: 1,
          longest_streak: 1,
          last_action_date: actionDate,
        })
    }

    // Get updated streak for response
    const { data: updatedStreak } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', user.id)
      .single()

    // Get updated totals for response
    const { data: updatedTotals } = await supabase
      .from('impact_totals')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get category streaks for response
    const { data: categoryStreaks } = await supabase
      .from('category_streaks')
      .select('category, current_streak, longest_streak')
      .eq('user_id', user.id)
      .gt('current_streak', 0)

    // Compute level from total points
    const totalPoints = updatedTotals?.total_points || actionPoints
    const levelInfo = computeLevel(totalPoints)

    return NextResponse.json({
      success: true,
      data: {
        actionId,
        completed: true,
        completedAt,
        co2Saved: action.co2_savings_kg,
        dollarSaved: action.dollar_savings,
        pointsEarned: actionPoints,
        streak: {
          current: updatedStreak?.current_streak || 1,
          longest: updatedStreak?.longest_streak || 1,
        },
        categoryStreaks: categoryStreaks || [],
        totals: {
          totalCo2SavedKg: updatedTotals?.total_co2_saved_kg || action.co2_savings_kg,
          totalDollarSaved: updatedTotals?.total_dollar_saved || action.dollar_savings,
          totalActionsCompleted: updatedTotals?.total_actions_completed || 1,
          totalPoints,
          level: levelInfo.level,
          levelEmoji: levelInfo.emoji,
        },
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

    console.error('[complete-action] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
