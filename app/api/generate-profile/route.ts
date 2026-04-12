import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateWithFallback } from '@/lib/ai'
import { UserProfileOutputSchema } from '@/lib/schemas'
import { buildProfilePrompt } from '@/lib/prompts/profile-builder'
import { SUSTAINABILITY_COACH_SYSTEM_PROMPT } from '@/lib/prompts/system-prompt'
import { estimateAnnualFootprint } from '@/lib/emissions/calculator'
import type { OnboardingAnswers } from '@/types/user'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, answers } = body as {
      sessionId: string
      answers: OnboardingAnswers
    }

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    if (!answers || !answers.commuteType || !answers.dietPattern) {
      return NextResponse.json(
        { error: 'Complete onboarding answers are required' },
        { status: 400 }
      )
    }

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

    // Generate AI profile analysis
    let aiResult
    try {
      aiResult = await generateWithFallback(
        UserProfileOutputSchema,
        {
          system: SUSTAINABILITY_COACH_SYSTEM_PROMPT,
          user: buildProfilePrompt(answers),
        },
        0.3 // Lower temperature for consistent, factual profile
      )
    } catch (aiError) {
      console.error('[generate-profile] AI generation failed:', aiError)
      // Fallback to manual estimation
      const fallbackFootprint = estimateAnnualFootprint({
        commuteType: answers.commuteType,
        commuteDistanceMiles: null,
        dietPattern: answers.dietPattern,
        livingSituation: answers.livingSituation,
      })

      aiResult = {
        topImpactAreas: determineTopImpactAreas(answers),
        estimatedAnnualFootprintKg: fallbackFootprint,
        aiProfileSummary: generateFallbackSummary(answers),
      }
    }

    // Save user to database
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({
        session_id: sessionId,
        city: answers.city,
        commute_type: answers.commuteType,
        diet_pattern: answers.dietPattern,
        living_situation: answers.livingSituation,
        primary_barrier: answers.primaryBarrier,
        primary_motivation: answers.primaryMotivation,
        ai_profile_summary: aiResult.aiProfileSummary,
        top_impact_areas: aiResult.topImpactAreas,
        estimated_annual_footprint_kg: aiResult.estimatedAnnualFootprintKg,
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
      },
    })
  } catch (error) {
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

  // Transport is high impact for drivers
  if (answers.commuteType === 'drive' || answers.commuteType === 'mixed') {
    areas.push('transport')
  }

  // Food is high impact for meat eaters
  if (answers.dietPattern === 'meat_most_days' || answers.dietPattern === 'chicken_fish') {
    areas.push('food')
  }

  // Energy is high impact for houses
  if (answers.livingSituation === 'suburbs' || answers.livingSituation === 'urban_house' || answers.livingSituation === 'rural') {
    areas.push('energy')
  }

  // Fill remaining slots
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
