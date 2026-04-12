'use client'

export function CelebrationOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-primary/90 z-50 flex items-center justify-center"
      onClick={onDismiss}
    >
      <div className="text-center text-white">
        <span className="text-6xl">✓</span>
        <p className="text-2xl font-bold mt-4">Great job!</p>
      </div>
    </div>
  )
}
