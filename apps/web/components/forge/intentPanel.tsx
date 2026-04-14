'use client'

import { Hammer } from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const MCP_OPTIONS = [
  { id: 'notion', label: 'Notion' },
  { id: 'slack', label: 'Slack' },
  { id: 'linear', label: 'Linear' },
  { id: 'sentry', label: 'Sentry' },
  { id: 'github', label: 'GitHub' },
  { id: 'jira', label: 'Jira' },
] as const

const MODEL_OPTIONS = [
  { value: 'speed' as const, label: 'Fast', description: 'Optimized for speed' },
  { value: 'balance' as const, label: 'Balanced', description: 'Best all-around' },
  { value: 'quality' as const, label: 'Quality', description: 'Maximum capability' },
]

interface IntentPanelProps {
  onForge: (intent: {
    prompt: string
    mcpHints: string[]
    modelPreference: 'speed' | 'balance' | 'quality'
  }) => void
  isForging: boolean
  initialPrompt?: string
}

export function IntentPanel({ onForge, isForging, initialPrompt = '' }: IntentPanelProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [selectedMcps, setSelectedMcps] = useState<string[]>([])
  const [modelPreference, setModelPreference] = useState<'speed' | 'balance' | 'quality'>('balance')

  const toggleMcp = useCallback((id: string) => {
    setSelectedMcps((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }, [])

  const handleForge = useCallback(() => {
    if (!prompt.trim() || isForging) return
    onForge({ prompt: prompt.trim(), mcpHints: selectedMcps, modelPreference })
  }, [prompt, selectedMcps, modelPreference, isForging, onForge])

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <h2 className="font-display text-2xl tracking-tight text-ink-900">
        Describe the job
      </h2>

      {/* Prompt textarea */}
      <div className="flex flex-col gap-2">
        <label htmlFor="forge-prompt" className="sr-only">
          What should your agent do?
        </label>
        <textarea
          id="forge-prompt"
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What should your agent do?"
          disabled={isForging}
          className="w-full resize-none rounded border border-bone-200 bg-bone-50 p-4 font-mono text-sm text-ink-700 placeholder:text-ink-300 focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-100 disabled:opacity-50"
        />
      </div>

      {/* MCP Hints */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink-500">
          MCP hints
        </span>
        <div className="flex flex-wrap gap-2">
          {MCP_OPTIONS.map((mcp) => (
            <button
              key={mcp.id}
              type="button"
              onClick={() => toggleMcp(mcp.id)}
              disabled={isForging}
              className={cn(
                'rounded border px-3 py-1.5 text-sm font-medium transition-colors',
                selectedMcps.includes(mcp.id)
                  ? 'border-ember-500 bg-ember-100 text-ember-600'
                  : 'border-bone-200 bg-bone-50 text-ink-500 hover:border-ink-300 hover:text-ink-700',
                isForging && 'opacity-50'
              )}
            >
              {mcp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model preference */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink-500">
          Quality tier
        </span>
        <div className="flex gap-2">
          {MODEL_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                'flex flex-1 cursor-pointer flex-col items-center gap-1 rounded border p-3 text-center transition-colors',
                modelPreference === opt.value
                  ? 'border-ember-500 bg-ember-100 text-ember-600'
                  : 'border-bone-200 bg-bone-50 text-ink-500 hover:border-ink-300',
                isForging && 'pointer-events-none opacity-50'
              )}
            >
              <input
                type="radio"
                name="model"
                value={opt.value}
                checked={modelPreference === opt.value}
                onChange={() => setModelPreference(opt.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-xs text-ink-300">{opt.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Forge button */}
      <Button
        variant="primary"
        className="w-full"
        onClick={handleForge}
        disabled={!prompt.trim() || isForging}
      >
        {isForging ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="31.4"
                strokeDashoffset="10"
                strokeLinecap="round"
              />
            </svg>
            Forging...
          </>
        ) : (
          <>
            <Hammer size={20} weight="duotone" />
            Forge agent
          </>
        )}
      </Button>
    </div>
  )
}
