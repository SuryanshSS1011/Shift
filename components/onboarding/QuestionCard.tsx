'use client'

interface QuestionCardProps {
  question: string
  options: Array<{ label: string; emoji: string; value: string }>
  onSelect: (value: string) => void
}

export function QuestionCard({ question, options, onSelect }: QuestionCardProps) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">{question}</h2>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className="w-full p-4 text-left rounded-lg bg-card hover:bg-accent transition-colors"
          >
            {option.emoji} {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
