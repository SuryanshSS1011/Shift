import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { computeLevel } from '@/lib/points'
import { ImpactShareCard } from '@/components/share/ImpactShareCard'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ sessionId: string }>
}

// Generate metadata for OG sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionId } = await params

  // Fetch user data for OG tags
  const { data: user } = await supabase
    .from('users')
    .select('id, city')
    .eq('session_id', sessionId)
    .single()

  if (!user) {
    return {
      title: 'Shift - Sustainability Impact',
      description: 'Track your sustainability impact with Shift',
    }
  }

  const { data: totals } = await supabase
    .from('impact_totals')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const totalPoints = totals?.total_points || 0
  const levelInfo = computeLevel(totalPoints)
  const co2Saved = totals?.total_co2_saved_kg || 0

  return {
    title: `${levelInfo.emoji} ${levelInfo.level} | ${co2Saved.toFixed(1)} kg CO₂ Saved | Shift`,
    description: `I've saved ${co2Saved.toFixed(1)} kg of CO₂ and earned ${totalPoints.toLocaleString()} points on Shift! Join me in taking small sustainability actions every day.`,
    openGraph: {
      title: `${levelInfo.emoji} ${levelInfo.level} on Shift`,
      description: `${co2Saved.toFixed(1)} kg CO₂ saved · ${totalPoints.toLocaleString()} points · Taking daily sustainability actions`,
      type: 'website',
      siteName: 'Shift',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${levelInfo.emoji} ${levelInfo.level} on Shift`,
      description: `${co2Saved.toFixed(1)} kg CO₂ saved · ${totalPoints.toLocaleString()} points`,
    },
  }
}

export default async function SharePage({ params }: PageProps) {
  const { sessionId } = await params

  // Fetch user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, city, focus_areas')
    .eq('session_id', sessionId)
    .single()

  if (userError || !user) {
    redirect('/')
  }

  // Fetch impact totals
  const { data: totals } = await supabase
    .from('impact_totals')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch current streak
  const { data: streak } = await supabase
    .from('streaks')
    .select('current_streak')
    .eq('user_id', user.id)
    .single()

  // Fetch recent actions for top SDGs
  const { data: recentActions } = await supabase
    .from('actions')
    .select('sdg_tags')
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(20)

  // Calculate top SDGs from recent actions
  const sdgCounts = new Map<number, number>()
  for (const action of recentActions || []) {
    for (const sdgId of action.sdg_tags || []) {
      sdgCounts.set(sdgId, (sdgCounts.get(sdgId) || 0) + 1)
    }
  }
  const topSDGs = Array.from(sdgCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id)

  // Compute level
  const totalPoints = totals?.total_points || 0
  const levelInfo = computeLevel(totalPoints)

  return (
    <div className="min-h-screen bg-[#0f1a0f] flex flex-col items-center justify-center px-4 py-8">
      <ImpactShareCard
        level={levelInfo.level}
        levelEmoji={levelInfo.emoji}
        totalCo2SavedKg={totals?.total_co2_saved_kg || 0}
        totalPoints={totalPoints}
        topSDGs={topSDGs}
        currentStreak={streak?.current_streak || 0}
      />

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors text-lg"
        >
          Join Shift
        </Link>
        <p className="text-green-400/70 text-sm mt-4">
          Start your sustainability journey in 90 seconds
        </p>
      </div>
    </div>
  )
}
