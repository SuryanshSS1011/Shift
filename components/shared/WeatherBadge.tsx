'use client'

interface WeatherBadgeProps {
  temperature: number
  condition: string
}

export function WeatherBadge({ temperature, condition }: WeatherBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-card rounded-full text-sm">
      <span>{temperature}°F</span>
      <span className="text-muted-foreground">{condition}</span>
    </div>
  )
}
