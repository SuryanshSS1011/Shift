'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

const impactStats = [
  { value: '2.5kg', label: 'avg CO₂ saved per action' },
  { value: '90sec', label: 'to get started' },
  { value: '200+', label: 'personalized actions' },
]

const features = [
  {
    icon: '1',
    title: 'One Action Per Day',
    description: 'No overwhelm. Just one tiny, personalized sustainability action that fits your actual life.',
  },
  {
    icon: '2',
    title: 'AI-Powered Personalization',
    description: 'Actions tailored to your city, commute, diet, and motivations — not generic tips.',
  },
  {
    icon: '3',
    title: 'Real Impact Tracking',
    description: 'See exactly how much CO₂ and money you save with EPA-backed calculations.',
  },
  {
    icon: '4',
    title: 'Build Lasting Habits',
    description: 'Streak tracking and behavioral science to turn actions into automatic habits.',
  },
]

export default function Home() {
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const sessionId = localStorage.getItem('shift_session_id')
    if (sessionId) {
      setHasSession(true)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0f1a0f]">
      {/* Hero Section */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-6">
              <Logo variant="full" size="lg" />
            </div>
            <p className="text-xl md:text-2xl text-green-300 mb-2">
              One tiny action. One day at a time.
            </p>
            <p className="text-green-400 mb-8 max-w-xl mx-auto">
              AI-powered sustainability micro-actions personalized to your actual life.
              Track your real impact. Build habits that stick.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {hasSession ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors text-lg"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors text-lg"
              >
                Start in 90 Seconds
              </Link>
            )}
            {hasSession ? (
              <Link
                href="/onboarding?retake=true"
                className="inline-flex items-center justify-center px-8 py-4 border border-green-600 text-green-400 hover:bg-green-600/10 font-semibold rounded-xl transition-colors text-lg"
              >
                Retake Quiz
              </Link>
            ) : (
              <Link
                href="/dashboard?demo=true"
                className="inline-flex items-center justify-center px-8 py-4 border border-green-600 text-green-400 hover:bg-green-600/10 font-semibold rounded-xl transition-colors text-lg"
              >
                Try Demo
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Impact Stats */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="px-4 py-12 border-y border-green-800/30"
      >
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {impactStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-50">
                  {stat.value}
                </div>
                <div className="text-green-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-2xl md:text-3xl font-bold text-green-50 text-center mb-10"
          >
            Why Shift Works
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="bg-[#1a2e1a] rounded-2xl p-6 border border-green-800/30"
              >
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-green-50 mb-2">
                  {feature.title}
                </h3>
                <p className="text-green-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-12 md:py-16 bg-[#1a2e1a]/50">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-2xl md:text-3xl font-bold text-green-50 text-center mb-10"
          >
            How It Works
          </motion.h2>

          <div className="space-y-6">
            {[
              { step: '1', title: 'Answer 5 Quick Questions', desc: 'Tell us about your commute, diet, and what motivates you.' },
              { step: '2', title: 'Get Your AI Profile', desc: 'We analyze your lifestyle to find your highest-impact opportunities.' },
              { step: '3', title: 'Do One Action Daily', desc: 'Each day, get one tiny action tailored just for you.' },
              { step: '4', title: 'Watch Your Impact Grow', desc: 'Track your CO₂ savings, money saved, and streak.' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="flex gap-4 items-start"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-50">{item.title}</h3>
                  <p className="text-green-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-green-50 mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-green-400 mb-8">
              Join thousands building sustainable habits, one tiny action at a time.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors text-lg"
            >
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-green-800/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Logo variant="full" size="sm" />
          </div>
          <p className="text-green-400 text-sm">
            Making sustainability accessible, one micro-action at a time.
          </p>
          <p className="text-green-600 text-xs mt-4">
            Built with behavioral science and AI.
          </p>
        </div>
      </footer>
    </div>
  )
}
