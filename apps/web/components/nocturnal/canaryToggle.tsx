'use client'

import { useCallback, useState } from 'react'
import { Moon, CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CanaryToggleProps {
  agentSlug: string
  initialEnabled?: boolean
  initialSampleInputs?: string
}

/**
 * Nightly canary subscription toggle for an agent.
 * Posts to /api/nocturnal/subscribe when enabled.
 */
export function CanaryToggle({
  agentSlug,
  initialEnabled = false,
  initialSampleInputs = '',
}: CanaryToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [sampleInputs, setSampleInputs] = useState(initialSampleInputs)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = useCallback(() => {
    setEnabled((v) => !v)
    setSaved(false)
    setError(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/nocturnal/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentSlug,
          sampleInputs: sampleInputs
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          enabled,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `HTTP ${res.status}`)
      }
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }, [agentSlug, sampleInputs, enabled])

  return (
    <section className="rounded border border-bone-200 bg-bone-50 p-5 shadow-anvil">
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              checked={enabled}
              onChange={handleToggle}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-bone-200 transition-colors peer-checked:bg-ember-500" />
            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-bone-50 shadow-anvil transition-transform peer-checked:translate-x-5" />
          </div>
          <div className="flex items-center gap-2">
            <Moon size={16} weight="duotone" className="text-ink-700" />
            <span className="text-sm font-medium text-ink-900">Nightly canary</span>
          </div>
        </label>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-jade-500">
            <CheckCircle size={14} weight="fill" />
            Saved
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-ink-500">
        Runs sample inputs every night at 02:00 UTC and emails a digest at 06:30 local time.
      </p>

      {enabled && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-ink-500">
              Sample inputs (one per line)
            </label>
            <Textarea
              className="mt-1"
              rows={4}
              value={sampleInputs}
              onChange={(e) => setSampleInputs(e.target.value)}
              placeholder={'P0 outage in payments\nDatabase connection spike'}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save canary'}
            </Button>
            {error && <span className="text-xs text-rust-500">{error}</span>}
          </div>
        </div>
      )}
    </section>
  )
}
