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
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get current streak data
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (streakError || !streak) {
      return NextResponse.json(
        { success: false, error: 'Streak data not found' },
        { status: 404 }
      )
    }

    // Check if freeze is available
    if (!streak.streak_freeze_available) {
      return NextResponse.json(
        { success: false, error: 'No streak freeze available' },
        { status: 400 }
      )
    }

    // Check if last freeze was used within 30 days
    if (streak.last_freeze_used_at) {
      const lastFreezeDate = new Date(streak.last_freeze_used_at)
      const daysSinceLastFreeze = Math.floor(
        (Date.now() - lastFreezeDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceLastFreeze < 30) {
        return NextResponse.json(
          {
            success: false,
            error: `Streak freeze can only be used once per 30 days. ${30 - daysSinceLastFreeze} days remaining.`,
          },
          { status: 400 }
        )
      }
    }

    // Apply the freeze
    const { error: updateError } = await supabase
      .from('streaks')
      .update({
        streak_freeze_available: false,
        last_freeze_used_at: new Date().toISOString(),
        // Extend the last action date to today to prevent streak break
        last_action_date: new Date().toISOString().split('T')[0],
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[freeze-streak] Update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to apply streak freeze' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Streak freeze applied successfully',
        nextFreezeAvailable: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    })
  } catch (error) {
    console.error('[freeze-streak] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check freeze availability
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      )
    }

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

    // Get streak data
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('streak_freeze_available, last_freeze_used_at')
      .eq('user_id', user.id)
      .single()

    if (streakError || !streak) {
      return NextResponse.json({
        success: true,
        data: {
          freezeAvailable: false,
          daysUntilNextFreeze: null,
        },
      })
    }

    let daysUntilNextFreeze = null
    if (streak.last_freeze_used_at) {
      const lastFreezeDate = new Date(streak.last_freeze_used_at)
      const daysSinceLastFreeze = Math.floor(
        (Date.now() - lastFreezeDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceLastFreeze < 30) {
        daysUntilNextFreeze = 30 - daysSinceLastFreeze
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        freezeAvailable: streak.streak_freeze_available && daysUntilNextFreeze === null,
        daysUntilNextFreeze,
      },
    })
  } catch (error) {
    console.error('[freeze-streak] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
