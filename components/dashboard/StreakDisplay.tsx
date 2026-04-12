'use client'

export function StreakDisplay({ streak }: { streak: number }) {
  return (
    <div className="text-center">
      <span className="text-4xl font-bold text-primary">{streak}</span>
      <p className="text-muted-foreground">day streak</p>
    </div>
  )
}
