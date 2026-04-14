'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ExportFormats {
  claude: string
  openai: string
  langGraph: string
}

interface ExportPanelProps {
  exportFormats: ExportFormats
}

const TABS = [
  { key: 'claude' as const, label: 'Claude YAML' },
  { key: 'openai' as const, label: 'OpenAI JSON' },
  { key: 'langGraph' as const, label: 'LangGraph Python' },
]

export function ExportPanel({ exportFormats }: ExportPanelProps) {
  const [activeTab, setActiveTab] = useState<keyof ExportFormats>('claude')
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const text = exportFormats[activeTab]
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [activeTab, exportFormats])

  const content = exportFormats[activeTab] || ''

  return (
    <div className="rounded border border-bone-200 bg-bone-50">
      {/* Tab bar */}
      <div className="flex border-b border-bone-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key)
              setCopied(false)
            }}
            className={cn(
              'flex-1 px-4 py-2.5 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'border-b-2 border-ember-500 text-ember-600 bg-bone-50'
                : 'text-ink-500 hover:text-ink-700 hover:bg-bone-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code display */}
      <div className="relative">
        <pre className="max-h-64 overflow-auto p-4 font-mono text-xs leading-relaxed text-ink-700">
          {content || 'No export data available yet.'}
        </pre>

        {/* Copy button */}
        {content && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-3 top-3 rounded border border-bone-200 bg-bone-100 px-3 py-1 text-xs font-medium text-ink-500 transition-colors hover:bg-bone-200 hover:text-ink-700"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}
