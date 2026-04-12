'use client'

import { useCallback } from 'react'
import { ClipboardText } from '@phosphor-icons/react'
import { Textarea } from '@/components/ui/textarea'

const SAMPLE_TEXT = `Every Monday morning our on-call engineer triages the weekend's Sentry issues.
They open the top 5 unresolved errors, cross-reference with recent deploys in Linear,
and post a summary to #eng-weekly with owners tagged.

The format is:
- Issue title (link)
- Blast radius (users affected)
- Suspected commit / deploy
- Owner

Last week it took Maya 45 minutes. We want this automated.`

interface ConversationInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ConversationInput({ value, onChange, disabled }: ConversationInputProps) {
  const handlePasteSample = useCallback(() => {
    onChange(SAMPLE_TEXT)
  }, [onChange])

  return (
    <div className="relative rounded border border-bone-200 bg-bone-50 bg-paper-grain p-4 shadow-anvil">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-wider text-ink-500">
          Your routine
        </label>
        <button
          type="button"
          onClick={handlePasteSample}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-ink-500 transition-colors hover:bg-bone-200 hover:text-ink-900 disabled:opacity-40"
        >
          <ClipboardText size={12} weight="duotone" />
          Paste sample
        </button>
      </div>
      <Textarea
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste a Slack thread, meeting notes, or describe a workflow..."
        disabled={disabled}
        className="resize-none bg-transparent font-mono text-[13px] leading-relaxed"
      />
    </div>
  )
}
