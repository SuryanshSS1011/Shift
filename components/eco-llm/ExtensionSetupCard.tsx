'use client'

import { useState } from 'react'
import { Card, Text } from '@tremor/react'
import { ChevronDown, ChevronUp, Puzzle, ExternalLink } from 'lucide-react'

export function ExtensionSetupCard() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="!bg-[#1a2e1a] !border-green-800/30 !ring-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-900/50 flex items-center justify-center">
            <Puzzle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-green-50">
              Shift Extension
            </h3>
            <Text className="!text-green-400/70 text-sm">
              Track LLM impact on Gemini
            </Text>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-green-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-green-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="bg-[#0f1a0f] rounded-lg p-4">
            <h4 className="text-green-50 font-medium mb-3">
              How to Install
            </h4>
            <ol className="space-y-3 text-sm text-green-400">
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">1.</span>
                <span>
                  Open Chrome and go to{' '}
                  <code className="bg-green-900/30 px-1 rounded">
                    chrome://extensions
                  </code>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">2.</span>
                <span>Enable &quot;Developer mode&quot; in the top right</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">3.</span>
                <span>
                  Click &quot;Load unpacked&quot; and select the{' '}
                  <code className="bg-green-900/30 px-1 rounded">
                    extension/
                  </code>{' '}
                  folder
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">4.</span>
                <span>
                  Click the extension icon and configure your Upstash credentials
                </span>
              </li>
            </ol>
          </div>

          <div className="bg-[#0f1a0f] rounded-lg p-4">
            <h4 className="text-green-50 font-medium mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-green-400">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Real-time token counting as you type</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Energy, CO₂, and water impact estimates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Semantic cache to avoid redundant LLM calls</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Grid carbon intensity forecast</span>
              </li>
            </ul>
          </div>

          <a
            href="https://gemini.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <span>Try on Gemini</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </Card>
  )
}
