'use client'

import { Card, Metric, Text } from '@tremor/react'
import { Skeleton } from '@/components/ui/skeleton'
import type { EcoLLMMetrics } from '@/app/api/eco-llm-metrics/route'

interface LLMMetricsCardProps {
  metrics: EcoLLMMetrics | null
  isLoading: boolean
}

export function LLMMetricsCard({ metrics, isLoading }: LLMMetricsCardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-green-50">
          Environmental Savings
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-12" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const data = metrics || {
    energySavedWh: 0,
    co2SavedGrams: 0,
    waterSavedMl: 0,
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-green-50">
        Environmental Savings
      </h3>
      <p className="text-green-400/70 text-sm -mt-2">
        Estimated impact from using semantic cache
      </p>

      <div className="grid grid-cols-3 gap-3">
        <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
          <Text className="!text-green-400">Energy Saved</Text>
          <Metric className="!text-green-50 !text-2xl">
            {data.energySavedWh.toFixed(1)}
          </Metric>
          <Text className="!text-green-400/70">Wh</Text>
        </Card>

        <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
          <Text className="!text-green-400">CO₂ Avoided</Text>
          <Metric className="!text-green-50 !text-2xl">
            {data.co2SavedGrams.toFixed(1)}
          </Metric>
          <Text className="!text-green-400/70">grams</Text>
        </Card>

        <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
          <Text className="!text-green-400">Water Saved</Text>
          <Metric className="!text-green-50 !text-2xl">
            {data.waterSavedMl.toFixed(1)}
          </Metric>
          <Text className="!text-green-400/70">mL</Text>
        </Card>
      </div>

      {/* Equivalencies */}
      {metrics && metrics.equivalencies && (
        <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
          <Text className="!text-green-400 mb-3">That&apos;s equivalent to...</Text>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0f1a0f] rounded-lg p-3 text-center">
              <div className="text-green-50 font-semibold text-lg">
                {metrics.equivalencies.smartphoneCharges}
              </div>
              <div className="text-green-400 text-xs">phone charges</div>
            </div>
            <div className="bg-[#0f1a0f] rounded-lg p-3 text-center">
              <div className="text-green-50 font-semibold text-lg">
                {metrics.equivalencies.ledBulbHours}
              </div>
              <div className="text-green-400 text-xs">LED bulb hours</div>
            </div>
            <div className="bg-[#0f1a0f] rounded-lg p-3 text-center">
              <div className="text-green-50 font-semibold text-lg">
                {metrics.equivalencies.drivingMeters}
              </div>
              <div className="text-green-400 text-xs">meters not driven</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
