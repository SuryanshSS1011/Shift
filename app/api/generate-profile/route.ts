import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { supabase } from '@/lib/supabase'
import { generateWithFallback } from '@/lib/ai'
import { UserProfileOutputSchema } from '@/lib/schemas'
import { buildProfilePrompt } from '@/lib/prompts/profile-builder'
import { SUSTAINABILITY_COACH_SYSTEM_PROMPT } from '@/lib/prompts/system-prompt'
import { estimateAnnualFootprint } from '@/lib/emissions/calculator'
import { geocodeAddress, getCommuteDistance } from '@/lib/google-maps'
import { estimateCommuteCO2 } from '@/lib/climatiq'
import { getGridIntensity } from '@/lib/electricity-maps'
import { getWeather } from '@/lib/open-meteo'
import type { OnboardingAnswers } from '@/types/user'

// Input validation schema
const InputSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  answers: z.object({
    commuteType: z.enum(['drive', 'transit', 'bike_walk', 'wfh', 'mixed']),
    dietPattern: z.enum(['meat_most_days', 'chicken_fish', 'mostly_plant', 'vegan_vegetarian']),
    livingSituation: z.enum(['city_apartment', 'urban_house', 'suburbs', 'rural']),
    primaryBarrier: z.enum(['time', 'cost', 'knowledge', 'overwhelmed']),
    primaryMotivation: z.enum(['planet', 'money', 'health', 'community']),
    city: z.string().min(1),
    homeAddress: z.string().optional(),
    workAddress: z.string().optional(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const { sessionId, answers } = InputSchema.parse(body)

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Profile already exists for this session' },
        { status: 400 }
      )
    }

    // Initialize commute data
    let lat: number | null = null
    let lng: number | null = null
    let commuteDistanceMiles: number | null = null
    let carCo2KgPerTrip: number | null = null
    let transitCo2KgPerTrip: number | null = null
    let dailySavingsIfSwitched: number | null = null
    let electricityZone: string | null = null

    // Pipeline: Geocode addresses and calculate commute data
    if (answers.homeAddress) {
      try {
        const homeLocation = await geocodeAddress(answers.homeAddress)
        lat = homeLocation.lat
        lng = homeLocation.lng

        // Get electricity zone and grid intensity (cached)
        try {
          const gridData = await getGridIntensity(lat, lng)
          electricityZone = gridData.zone
        } catch (gridError) {
          console.error('[generate-profile] Grid intensity error:', gridError)
        }

        // Get weather for context (cached)
        try {
          await getWeather(lat, lng)
        } catch (weatherError) {
          console.error('[generate-profile] Weather error:', weatherError)
        }

        // Calculate commute distance if work address provided
        if (answers.workAddress && answers.commuteType !== 'wfh') {
          try {
            const workLocation = await geocodeAddress(answers.workAddress)
            const commuteData = await getCommuteDistance(
              lat,
              lng,
              workLocation.lat,
              workLocation.lng
            )
            commuteDistanceMiles = commuteData.drivingMiles

            // Get CO2 estimates from Climatiq
            if (commuteDistanceMiles > 0) {
              try {
                const co2Data = await estimateCommuteCO2(commuteDistanceMiles)
                carCo2KgPerTrip = co2Data.carCo2KgPerTrip
                transitCo2KgPerTrip = co2Data.transitCo2KgPerTrip
                dailySavingsIfSwitched = co2Data.dailySavingsIfSwitched
              } catch (climatiqError) {
                console.error('[generate-profile] Climatiq error:', climatiqError)
                // Fallback estimate: 0.404 kg CO2 per mile for car
                carCo2KgPerTrip = commuteDistanceMiles * 0.404
                transitCo2KgPerTrip = carCo2KgPerTrip * 0.1
                dailySavingsIfSwitched = carCo2KgPerTrip - transitCo2KgPerTrip
              }
            }
          } catch (workGeoError) {
            console.error('[generate-profile] Work geocode error:', workGeoError)
          }
        }
      } catch (homeGeoError) {
        console.error('[generate-profile] Home geocode error:', homeGeoError)
        // Continue without location data - will use city-based defaults
      }
    }

    // Generate AI profile analysis
    let aiResult
    try {
      aiResult = await generateWithFallback(
        UserProfileOutputSchema,
        {
          system: SUSTAINABILITY_COACH_SYSTEM_PROMPT,
          user: buildProfilePrompt(answers as OnboardingAnswers),
        },
        0.3
      )
    } catch (aiError) {
      console.error('[generate-profile] AI generation failed:', aiError)
      // Fallback to manual estimation
      const fallbackFootprint = estimateAnnualFootprint({
        commuteType: answers.commuteType,
        commuteDistanceMiles,
        dietPattern: answers.dietPattern,
        livingSituation: answers.livingSituation,
      })

      aiResult = {
        topImpactAreas: determineTopImpactAreas(answers as OnboardingAnswers),
        estimatedAnnualFootprintKg: fallbackFootprint,
        aiProfileSummary: generateFallbackSummary(answers as OnboardingAnswers),
      }
    }

    // Save user to database with all computed fields
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({
        session_id: sessionId,
        city: answers.city,
        commute_type: answers.commuteType,
        commute_distance_miles: commuteDistanceMiles,
        diet_pattern: answers.dietPattern,
        living_situation: answers.livingSituation,
        primary_barrier: answers.primaryBarrier,
        primary_motivation: answers.primaryMotivation,
        ai_profile_summary: aiResult.aiProfileSummary,
        top_impact_areas: aiResult.topImpactAreas,
        estimated_annual_footprint_kg: aiResult.estimatedAnnualFootprintKg,
        lat,
        lng,
        electricity_zone: electricityZone,
        car_co2_kg_per_trip: carCo2KgPerTrip,
        transit_co2_kg_per_trip: transitCo2KgPerTrip,
        daily_savings_if_switched: dailySavingsIfSwitched,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[generate-profile] Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      )
    }

    // Initialize streak record
    await supabase.from('streaks').insert({
      user_id: user.id,
      current_streak: 0,
      longest_streak: 0,
    })

    // Initialize impact totals
    await supabase.from('impact_totals').insert({
      user_id: user.id,
      total_co2_saved_kg: 0,
      total_dollar_saved: 0,
      total_actions_completed: 0,
    })

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        topImpactAreas: aiResult.topImpactAreas,
        estimatedAnnualFootprintKg: aiResult.estimatedAnnualFootprintKg,
        aiProfileSummary: aiResult.aiProfileSummary,
        commuteDistanceMiles,
        carCo2KgPerTrip,
        transitCo2KgPerTrip,
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

    console.error('[generate-profile] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Fallback functions when AI fails
function determineTopImpactAreas(
  answers: OnboardingAnswers
): ('food' | 'transport' | 'energy' | 'shopping' | 'water' | 'waste')[] {
  const areas: ('food' | 'transport' | 'energy' | 'shopping' | 'water' | 'waste')[] = []

  if (answers.commuteType === 'drive' || answers.commuteType === 'mixed') {
    areas.push('transport')
  }

  if (answers.dietPattern === 'meat_most_days' || answers.dietPattern === 'chicken_fish') {
    areas.push('food')
  }

  if (answers.livingSituation === 'suburbs' || answers.livingSituation === 'urban_house' || answers.livingSituation === 'rural') {
    areas.push('energy')
  }

  const allAreas: ('food' | 'transport' | 'energy' | 'shopping' | 'water' | 'waste')[] = ['food', 'transport', 'energy', 'shopping', 'water', 'waste']
  for (const area of allAreas) {
    if (areas.length >= 3) break
    if (!areas.includes(area)) {
      areas.push(area)
    }
  }

  return areas.slice(0, 3)
}

function generateFallbackSummary(answers: OnboardingAnswers): string {
  const motivationMap: Record<string, string> = {
    planet: "You're driven by protecting our planet",
    money: "You're motivated by saving money",
    health: "You care about health and wellbeing",
    community: "You want to inspire your community",
  }

  const motivation = motivationMap[answers.primaryMotivation] || "You're ready to make a difference"

  let opportunity = ''
  if (answers.commuteType === 'drive') {
    opportunity = 'Your commute offers the biggest opportunity for impact.'
  } else if (answers.dietPattern === 'meat_most_days') {
    opportunity = 'Small food swaps could make a big difference for you.'
  } else {
    opportunity = 'Home energy habits are a great place to start.'
  }

  return `${motivation}. ${opportunity}`
}
