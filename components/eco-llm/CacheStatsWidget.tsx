'use client'

import { Card, Text } from '@tremor/react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import type { EcoLLMMetrics } from '@/app/api/eco-llm-metrics/route'

interface CacheStatsWidgetProps {
  metrics: EcoLLMMetrics | null
  isLoading: boolean
}

export function CacheStatsWidget({ metrics, isLoading }: CacheStatsWidgetProps) {
  if (isLoading) {
    return (
      <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </Card>
    )
  }

  const data = metrics || {
    totalPromptsCached: 0,
    estimatedCacheHits: 0,
    cacheHitRate: 0,
  }

  const hitRatePercent = data.cacheHitRate * 100

  return (
    <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
      <h3 className="text-lg font-semibold text-green-50 mb-4">
        Semantic Cache Stats
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Prompts Cached */}
        <div className="bg-[#0f1a0f] rounded-xl p-4">
          <Text className="!text-green-400 mb-1">Prompts Cached</Text>
          <div className="text-3xl font-bold text-green-50">
            {data.totalPromptsCached}
          </div>
          <Text className="!text-green-400/70 text-xs">
            in vector database
          </Text>
        </div>

        {/* Cache Hits */}
        <div className="bg-[#0f1a0f] rounded-xl p-4">
          <Text className="!text-green-400 mb-1">Est. Cache Hits</Text>
          <div className="text-3xl font-bold text-green-50">
            {data.estimatedCacheHits}
          </div>
          <Text className="!text-green-400/70 text-xs">
            LLM calls avoided
          </Text>
        </div>
      </div>

      {/* Cache Hit Rate */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <Text className="!text-green-400">Cache Hit Rate</Text>
          <Text className="!text-green-50 font-medium">
            {hitRatePercent.toFixed(0)}%
          </Text>
        </div>
        <div className="w-full h-3 bg-[#0f1a0f] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${hitRatePercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <Text className="!text-green-400/70 text-xs mt-2 text-center">
          Higher hit rate = more energy saved
        </Text>
      </div>
    </Card>
  )
}
