'use client'

import { motion } from 'framer-motion'

function SkeletonBox({ className }: { className?: string }) {
  return (
    <motion.div
      className={`bg-gradient-to-r from-green-800/20 via-green-700/30 to-green-800/20 bg-[length:200%_100%] rounded ${className}`}
      initial={{ backgroundPosition: '-200% 0' }}
      animate={{ backgroundPosition: '200% 0' }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear' as const,
      }}
    />
  )
}

export function StreakDisplaySkeleton() {
  return (
    <div className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30">
      <SkeletonBox className="h-4 w-24 mb-3" />
      <SkeletonBox className="h-12 w-16 mb-2" />
      <SkeletonBox className="h-3 w-32" />
    </div>
  )
}

export function ImpactDashboardSkeleton() {
  return (
    <div className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30">
      <SkeletonBox className="h-5 w-32 mb-4" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <SkeletonBox className="h-8 w-16 mx-auto mb-2" />
            <SkeletonBox className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-green-800/30">
        <SkeletonBox className="h-4 w-full" />
      </div>
    </div>
  )
}

export function ActivityHeatmapSkeleton() {
  return (
    <div className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30">
      <SkeletonBox className="h-4 w-24 mb-3" />
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 35 }).map((_, i) => (
          <SkeletonBox key={i} className="w-4 h-4" />
        ))}
      </div>
    </div>
  )
}

export function GridIntensitySkeleton() {
  return (
    <div className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBox className="h-5 w-32" />
        <SkeletonBox className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <SkeletonBox className="h-4 w-28" />
          <SkeletonBox className="h-4 w-16" />
        </div>
        <SkeletonBox className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-4 w-12" />
        </div>
      </div>
    </div>
  )
}

export function GridForecastSkeleton() {
  return (
    <div className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBox className="h-5 w-40" />
        <SkeletonBox className="h-6 w-24 rounded-full" />
      </div>
      <SkeletonBox className="h-32 w-full mb-4" />
      <SkeletonBox className="h-4 w-3/4" />
    </div>
  )
}

export function WeeklyReportSkeleton() {
  return (
    <div className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30">
      <SkeletonBox className="h-5 w-32 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <SkeletonBox className="h-4 w-28 mb-2" />
            <SkeletonBox className="h-3 w-full" />
            <SkeletonBox className="h-3 w-4/5 mt-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ActionHistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#1a2e1a] rounded-xl p-4 border border-green-800/30">
          <div className="flex items-start gap-3">
            <SkeletonBox className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <SkeletonBox className="h-4 w-3/4 mb-2" />
              <SkeletonBox className="h-3 w-1/2 mb-2" />
              <div className="flex gap-2">
                <SkeletonBox className="h-5 w-16 rounded-full" />
                <SkeletonBox className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((section) => (
        <div key={section} className="bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30">
          <SkeletonBox className="h-5 w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
