'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/shared/Header'
import { LLMMetricsCard } from '@/components/eco-llm/LLMMetricsCard'
import { CacheStatsWidget } from '@/components/eco-llm/CacheStatsWidget'
import { GridTimeRecommendation } from '@/components/eco-llm/GridTimeRecommendation'
import { ExtensionSetupCard } from '@/components/eco-llm/ExtensionSetupCard'
import type { EcoLLMMetrics } from '@/app/api/eco-llm-metrics/route'

export default function EcoLLMPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<EcoLLMMetrics | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/eco-llm-metrics')
      const result = await response.json()

      if (result.success) {
        setMetrics(result.data)
      } else {
        setError('Failed to load metrics')
      }
    } catch (err) {
      console.error('Error fetching eco-llm metrics:', err)
      setError('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1a0f]">
      <Header showMenu />
      <main className="px-4 py-6 max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-green-50 mb-2">
            Eco LLM Dashboard
          </h1>
          <p className="text-green-400 text-sm">
            Track the environmental impact of your AI conversations
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-200"
          >
            {error}
            <button
              onClick={fetchMetrics}
              className="ml-4 text-red-400 underline hover:text-red-300"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Extension Setup Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ExtensionSetupCard />
        </motion.div>

        {/* KPI Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <LLMMetricsCard metrics={metrics} isLoading={isLoading} />
        </motion.div>

        {/* Cache Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <CacheStatsWidget metrics={metrics} isLoading={isLoading} />
        </motion.div>

        {/* Grid Time Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <GridTimeRecommendation />
        </motion.div>
      </main>
    </div>
  )
}
