'use client'

import { ActivityCalendar } from 'react-activity-calendar'

interface ActivityHeatmapProps {
  completedDates: string[] // ISO date strings (YYYY-MM-DD)
}

export function ActivityHeatmap({ completedDates }: ActivityHeatmapProps) {
  // Generate last 12 weeks of data
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 84) // 12 weeks = 84 days

  const completedSet = new Set(completedDates)

  // Build activity data array
  const data: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> = []
  const current = new Date(startDate)

  while (current <= today) {
    const dateStr = current.toISOString().split('T')[0]
    const completed = completedSet.has(dateStr)
    data.push({
      date: dateStr,
      count: completed ? 1 : 0,
      level: completed ? 4 : 0,
    })
    current.setDate(current.getDate() + 1)
  }

  return (
    <div className="bg-[#1a2e1a] rounded-2xl p-6 border border-green-800/30">
      <h3 className="text-green-300 text-sm font-medium mb-4">
        12-Week Activity
      </h3>
      <div className="w-full flex justify-center">
        <ActivityCalendar
          data={data}
          blockSize={14}
          blockMargin={4}
          fontSize={12}
          theme={{
            light: ['#0f1a0f', '#134e13', '#22c55e', '#4ade80', '#86efac'],
            dark: ['#0f1a0f', '#134e13', '#22c55e', '#4ade80', '#86efac'],
          }}
        />
      </div>
      <p className="text-green-400 text-xs mt-3 text-center">
        {completedDates.length} actions completed in the last 12 weeks
      </p>
    </div>
  )
}
