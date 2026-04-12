'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface VoiceResultsProps {
  yaml: string
  slug?: string
}

/**
 * Post-forge CTA card for voice recording results.
 *
 * Two actions:
 * - "Continue here" — expand to show read-only YAML preview
 * - "Open on desktop" — link to /forge with generated YAML
 *
 * Anvil card styling: bone-50 bg, border-bone-200, shadow-ember.
 */
export function VoiceResults({ yaml, slug }: VoiceResultsProps) {
  const [expanded, setExpanded] = useState(false)

  const desktopUrl = `/forge?yaml=${encodeURIComponent(yaml.slice(0, 4000))}`

  return (
    <motion.div
      className="w-full max-w-sm rounded border border-bone-200 bg-bone-50 shadow-ember"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex flex-col gap-3 p-4">
        <h3 className="text-center font-display text-lg tracking-tight text-ink-900">
          Agent forged
        </h3>

        <div className="flex gap-3">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Collapse' : 'Continue here'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            asChild
          >
            <a href={desktopUrl}>
              Open on desktop
            </a>
          </Button>
        </div>

        {slug && (
          <p className="text-center text-xs text-ink-300">
            Saved as <code className="font-mono text-ink-500">{slug}</code>
          </p>
        )}
      </div>

      {/* Expandable YAML preview */}
      {expanded && (
        <motion.div
          className="border-t border-bone-200"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <pre className="max-h-60 overflow-auto p-4 font-mono text-xs leading-5 text-ink-700">
            {yaml}
          </pre>
        </motion.div>
      )}
    </motion.div>
  )
}
