import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateWithFallback } from '@/lib/ai'
import { WeeklyReportOutputSchema } from '@/lib/schemas'
import { buildReportPrompt } from '@/lib/prompts/weekly-report'
import { SUSTAINABILITY_COACH_SYSTEM_PROMPT } from '@/lib/prompts/system-prompt'
import { kgToEquivalencies } from '@/lib/emissions/equivalencies'
import type { MicroAction } from '@/types/action'

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

    // Get actions from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const { data: weekActions, error: actionsError } = await supabase
      .from('actions')
      .select('*')
      .eq('user_id', user.id)
      .gte('action_date', sevenDaysAgoStr)
      .order('action_date', { ascending: false })

    if (actionsError) {
      console.error('[weekly-report] Actions fetch error:', actionsError)
      return NextResponse.json(
        { error: 'Failed to fetch actions' },
        { status: 500 }
      )
    }

    if (!weekActions || weekActions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          report: {
            whatWentWell: "This is your first week with Shift! Start completing daily actions to see your impact grow.",
            patternObserved: "No actions to analyze yet.",
            focusThisWeek: "Focus on completing your first action today to start building momentum.",
          },
          stats: {
            totalActions: 0,
            completedActions: 0,
            completionRate: 0,
            totalCo2SavedKg: 0,
            totalDollarSaved: 0,
            equivalencies: kgToEquivalencies(0),
          },
        },
      })
    }

    // Transform to MicroAction type
    const actions: MicroAction[] = weekActions.map(a => ({
      id: a.id,
      userId: a.user_id,
      actionDate: a.action_date,
      category: a.category,
      title: a.title,
      description: a.description,
      anchorHabit: a.anchor_habit,
      co2SavingsKg: a.co2_savings_kg,
      dollarSavings: a.dollar_savings,
      timeRequiredMinutes: a.time_required_minutes,
      difficultyLevel: a.difficulty_level,
      behavioralFrame: a.behavioral_frame,
      equivalencyLabel: a.equivalency_label,
      completed: a.completed,
      completedAt: a.completed_at,
      createdAt: a.created_at,
    }))

    // Calculate stats
    const completedActions = actions.filter(a => a.completed)
    const totalCo2SavedKg = completedActions.reduce((sum, a) => sum + a.co2SavingsKg, 0)
    const totalDollarSaved = completedActions.reduce((sum, a) => sum + a.dollarSavings, 0)

    // Generate AI report
    let report
    try {
      report = await generateWithFallback(
        WeeklyReportOutputSchema,
        {
          system: SUSTAINABILITY_COACH_SYSTEM_PROMPT,
          user: buildReportPrompt(actions),
        },
        0.8 // Higher temperature for warm, narrative tone
      )
    } catch (aiError) {
      console.error('[weekly-report] AI generation failed:', aiError)
      // Fallback report
      const completedCount = completedActions.length
      const totalCount = actions.length

      report = {
        whatWentWell: completedCount > 0
          ? `You completed ${completedCount} action${completedCount !== 1 ? 's' : ''} this week, saving ${totalCo2SavedKg.toFixed(1)} kg of CO₂!`
          : "This week was a chance to observe your habits. Every day is a new opportunity.",
        patternObserved: completedCount >= totalCount / 2
          ? "You're showing great consistency in completing your daily actions."
          : "It looks like some days were busier than others. That's completely normal.",
        focusThisWeek: completedCount > 0
          ? `Build on your momentum from ${completedActions[0]?.category || 'your recent actions'}.`
          : "Start with just one action today. Small steps lead to big changes.",
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        report,
        stats: {
          totalActions: actions.length,
          completedActions: completedActions.length,
          completionRate: actions.length > 0
            ? Math.round((completedActions.length / actions.length) * 100)
            : 0,
          totalCo2SavedKg,
          totalDollarSaved,
          equivalencies: kgToEquivalencies(totalCo2SavedKg),
          categoryCounts: getCategoryCounts(completedActions),
        },
        weekStartDate: sevenDaysAgoStr,
        weekEndDate: new Date().toISOString().split('T')[0],
      },
    })
  } catch (error) {
    console.error('[weekly-report] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getCategoryCounts(actions: MicroAction[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const action of actions) {
    counts[action.category] = (counts[action.category] || 0) + 1
  }
  return counts
}
