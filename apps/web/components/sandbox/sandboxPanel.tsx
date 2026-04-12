'use client'

import { useState } from 'react'
import { Fire, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface SandboxPanelProps {
  onRun: (input: string) => void
  isRunning: boolean
}

const SAMPLE_INPUTS = [
  'Critical alert: TimeoutError in /api/v2/users (142 occurrences)',
  'New deploy failed health check on staging',
  'Spike in 5xx errors from payment-service',
]

export function SandboxPanel({ onRun, isRunning }: SandboxPanelProps) {
  const [input, setInput] = useState('')

  return (
    <div className="flex h-full flex-col p-6">
      <h3 className="mb-4 font-display text-lg text-ink-900">Sandbox Input</h3>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter a sample message to test your agent..."
        rows={4}
        className="w-full resize-none rounded border border-bone-200 bg-bone-50 px-4 py-3 font-body text-sm text-ink-700 placeholder:text-ink-300 focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-500/20"
        disabled={isRunning}
      />

      {/* Sample input chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {SAMPLE_INPUTS.map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => setInput(sample)}
            disabled={isRunning}
            className="rounded-full border border-bone-200 bg-bone-100 px-3 py-1 text-xs text-ink-500 transition-colors hover:border-ember-400 hover:text-ember-500 disabled:opacity-50"
          >
            {sample.length > 40 ? `${sample.slice(0, 40)}...` : sample}
          </button>
        ))}
      </div>

      {/* Run button */}
      <Button
        onClick={() => onRun(input)}
        disabled={isRunning || !input.trim()}
        className="mt-6"
        variant="primary"
        size="default"
      >
        {isRunning ? (
          <>
            <SpinnerGap size={18} className="animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Fire size={18} weight="duotone" />
            Run in Sandbox
          </>
        )}
      </Button>
    </div>
  )
}
