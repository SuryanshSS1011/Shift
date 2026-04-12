import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { supabase } from '@/lib/supabase'
import { getGridIntensity } from '@/lib/electricity-maps'

const InputSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = InputSchema.parse(body)

    // Get user with lat/lng
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('lat, lng')
      .eq('session_id', sessionId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If no coordinates, return default data
    if (!user.lat || !user.lng) {
      return NextResponse.json({
        success: true,
        data: {
          zone: 'US-NY-NYIS',
          carbonIntensity: 280,
          renewablePercent: 32,
          fossilFuelPercent: 68,
        },
      })
    }

    // Fetch grid intensity (cached)
    const gridData = await getGridIntensity(user.lat, user.lng)

    return NextResponse.json({
      success: true,
      data: gridData,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('[grid-intensity] Error:', error)

    // Return fallback data on error
    return NextResponse.json({
      success: true,
      data: {
        zone: 'US-NY-NYIS',
        carbonIntensity: 280,
        renewablePercent: 32,
        fossilFuelPercent: 68,
      },
    })
  }
}
