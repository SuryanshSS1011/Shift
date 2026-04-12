'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ShareButtonProps {
  title?: string
  text?: string
  url?: string
  hashtags?: string[]
  stats?: {
    co2Saved?: number
    dollarsSaved?: number
    streak?: number
    actionsCompleted?: number
  }
  variant?: 'icon' | 'button' | 'card'
  className?: string
}

export function ShareButton({
  title = 'Shift - Sustainability Micro-Actions',
  text,
  url,
  hashtags = ['sustainability', 'climateaction', 'shift'],
  stats,
  variant = 'icon',
  className = '',
}: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.origin : '')

  // Build share text with stats
  const buildShareText = () => {
    if (text) return text

    const parts: string[] = []

    if (stats?.streak && stats.streak > 0) {
      parts.push(`${stats.streak} day streak`)
    }
    if (stats?.co2Saved && stats.co2Saved > 0) {
      parts.push(`${stats.co2Saved.toFixed(1)}kg CO₂ saved`)
    }
    if (stats?.dollarsSaved && stats.dollarsSaved > 0) {
      parts.push(`$${stats.dollarsSaved.toFixed(0)} saved`)
    }
    if (stats?.actionsCompleted && stats.actionsCompleted > 0) {
      parts.push(`${stats.actionsCompleted} actions completed`)
    }

    if (parts.length > 0) {
      return `I'm making a difference with Shift! ${parts.join(' | ')} 🌍`
    }

    return "I'm taking daily micro-actions for sustainability with Shift! 🌍"
  }

  const shareText = buildShareText()
  const hashtagString = hashtags.map((t) => `#${t}`).join(' ')

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    } else {
      setShowMenu(true)
    }
  }

  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(`${shareText}\n\n${hashtagString}`)
    const tweetUrl = encodeURIComponent(shareUrl)
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`,
      '_blank',
      'width=550,height=420'
    )
    setShowMenu(false)
  }

  const handleLinkedInShare = () => {
    const linkedInUrl = encodeURIComponent(shareUrl)
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${linkedInUrl}`,
      '_blank',
      'width=550,height=420'
    )
    setShowMenu(false)
  }

  const handleFacebookShare = () => {
    const fbUrl = encodeURIComponent(shareUrl)
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${fbUrl}`,
      '_blank',
      'width=550,height=420'
    )
    setShowMenu(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
    setShowMenu(false)
  }

  const ShareIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )

  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleNativeShare}
          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-800/20 rounded-lg transition-colors"
          aria-label="Share"
        >
          <ShareIcon />
        </button>

        <AnimatePresence>
          {showMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-[#1a2e1a] border border-green-800/50 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <ShareMenuItems
                  onTwitter={handleTwitterShare}
                  onLinkedIn={handleLinkedInShare}
                  onFacebook={handleFacebookShare}
                  onCopy={handleCopyLink}
                  copied={copied}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleNativeShare}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors"
        >
          <ShareIcon />
          <span>Share</span>
        </button>

        <AnimatePresence>
          {showMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute left-0 bottom-full mb-2 w-48 bg-[#1a2e1a] border border-green-800/50 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <ShareMenuItems
                  onTwitter={handleTwitterShare}
                  onLinkedIn={handleLinkedInShare}
                  onFacebook={handleFacebookShare}
                  onCopy={handleCopyLink}
                  copied={copied}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Card variant - shows all options inline
  return (
    <div className={`bg-[#1a2e1a] rounded-2xl p-5 border border-green-800/30 ${className}`}>
      <h3 className="text-lg font-semibold text-green-50 mb-3">Share Your Impact</h3>
      <p className="text-green-400 text-sm mb-4">{shareText}</p>
      <div className="flex gap-2">
        <button
          onClick={handleTwitterShare}
          className="flex-1 py-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors text-sm font-medium"
        >
          Twitter
        </button>
        <button
          onClick={handleLinkedInShare}
          className="flex-1 py-2 bg-[#0A66C2] hover:bg-[#084e96] text-white rounded-lg transition-colors text-sm font-medium"
        >
          LinkedIn
        </button>
        <button
          onClick={handleCopyLink}
          className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

function ShareMenuItems({
  onTwitter,
  onLinkedIn,
  onFacebook,
  onCopy,
  copied,
}: {
  onTwitter: () => void
  onLinkedIn: () => void
  onFacebook: () => void
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="py-1">
      <button
        onClick={onTwitter}
        className="flex items-center gap-3 w-full px-4 py-3 text-green-50 hover:bg-green-800/30 transition-colors"
      >
        <svg className="w-4 h-4 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Twitter / X
      </button>
      <button
        onClick={onLinkedIn}
        className="flex items-center gap-3 w-full px-4 py-3 text-green-50 hover:bg-green-800/30 transition-colors"
      >
        <svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </button>
      <button
        onClick={onFacebook}
        className="flex items-center gap-3 w-full px-4 py-3 text-green-50 hover:bg-green-800/30 transition-colors"
      >
        <svg className="w-4 h-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Facebook
      </button>
      <div className="border-t border-green-800/30 my-1" />
      <button
        onClick={onCopy}
        className="flex items-center gap-3 w-full px-4 py-3 text-green-50 hover:bg-green-800/30 transition-colors"
      >
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}
