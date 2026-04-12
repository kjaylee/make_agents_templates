'use client'

import { Bug, Play } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface FuzzPanelProps {
  running: boolean
  completed: number
  total: number
  passed: number
  failed: number
  onStart: () => void
}

export function FuzzPanel({ running, completed, total, passed, failed, onStart }: FuzzPanelProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <section className="rounded border border-bone-200 bg-bone-50 p-5 shadow-anvil">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug size={18} weight="duotone" className="text-ember-500" />
          <h2 className="font-display text-lg tracking-tight text-ink-900">Prompt Fuzzer</h2>
        </div>
        <Button size="sm" onClick={onStart} disabled={running}>
          <Play size={14} weight="fill" />
          {running ? 'Fuzzing…' : `Run Fuzzer (${total} cases)`}
        </Button>
      </header>

      {(running || completed > 0) && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-ink-500">
            <span className="font-mono">
              {completed} / {total} cases
            </span>
            <span>
              <span className="text-jade-500">{passed} passed</span>
              <span className="mx-2 text-ink-300">·</span>
              <span className="text-rust-500">{failed} failed</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bone-200">
            <div
              className="h-full bg-ember-500 transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </section>
  )
}
