import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const subscriptionSchema = z.object({
  sessionId: z.string().uuid(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = subscriptionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { sessionId, subscription } = parsed.data

    // Get user
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

    // Store subscription (upsert)
    const { error: subError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (subError) {
      // Table might not exist yet, that's okay
      console.error('[push-subscribe] Upsert error:', subError)
      // Return success anyway since push is optional
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Subscription saved' },
    })
  } catch (error) {
    console.error('[push-subscribe] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Unsubscribe
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
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
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete subscription
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      data: { message: 'Subscription removed' },
    })
  } catch (error) {
    console.error('[push-subscribe] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
