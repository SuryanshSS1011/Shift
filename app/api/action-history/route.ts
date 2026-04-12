import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const requestSchema = z.object({
  sessionId: z.string().uuid(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  category: z.string().optional(),
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

    const { sessionId, limit, offset, category } = parsed.data

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Build query
    let query = supabase
      .from('actions')
      .select('*')
      .eq('user_id', user.id)
      .order('action_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    const { data: actions, error: actionsError } = await query

    if (actionsError) {
      console.error('[action-history] Query error:', actionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch actions' },
        { status: 500 }
      )
    }

    // Transform to camelCase
    const transformedActions = (actions || []).map((action) => ({
      id: action.id,
      actionDate: action.action_date,
      category: action.category,
      title: action.title,
      description: action.description,
      co2SavingsKg: action.co2_savings_kg,
      dollarSavings: action.dollar_savings,
      timeRequiredMinutes: action.time_required_minutes,
      difficultyLevel: action.difficulty_level,
      completed: action.completed,
      completedAt: action.completed_at,
      createdAt: action.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: {
        actions: transformedActions,
        pagination: {
          limit,
          offset,
          hasMore: transformedActions.length === limit,
        },
      },
    })
  } catch (error) {
    console.error('[action-history] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
