'use client'

import { Warning, XCircle, Info } from '@phosphor-icons/react'
import type { LintNote } from '@forge/engine/types'

interface LintPanelProps {
  lintScore: number
  notes: LintNote[]
  onAutoFix?: (noteIndex: number) => void
}

function getSeverityIcon(severity: LintNote['severity']) {
  switch (severity) {
    case 'error':
      return <XCircle size={16} weight="fill" className="text-rust-500" />
    case 'warn':
      return <Warning size={16} weight="fill" className="text-gold-500" />
    case 'info':
      return <Info size={16} weight="fill" className="text-ink-300" />
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-jade-500'
  if (score >= 70) return 'bg-gold-500'
  return 'bg-rust-500'
}

function getScoreTextColor(score: number): string {
  if (score >= 90) return 'text-jade-600'
  if (score >= 70) return 'text-gold-600'
  return 'text-rust-600'
}

export function LintPanel({ lintScore, notes, onAutoFix }: LintPanelProps) {
  return (
    <div className="rounded border border-bone-200 bg-bone-50">
      {/* Score header */}
      <div className="border-b border-bone-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-700">
            Lint Score:{' '}
            <span className={getScoreTextColor(lintScore)}>{lintScore}/100</span>
          </span>
          <span className="text-xs text-ink-300">
            {notes.length} suggestion{notes.length !== 1 ? 's' : ''}
          </span>
        </div>
        {/* Score bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bone-200">
          <div
            className={`h-full rounded-full transition-all ${getScoreColor(lintScore)}`}
            style={{ width: `${Math.max(0, Math.min(100, lintScore))}%` }}
          />
        </div>
      </div>

      {/* Notes list */}
      {notes.length > 0 && (
        <div className="divide-y divide-bone-200">
          {notes.map((note, index) => (
            <div key={`${note.code}-${index}`} className="px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">{getSeverityIcon(note.severity)}</span>
                <div className="min-w-0 flex-1">
                  {note.line !== undefined && (
                    <span className="mr-1 text-xs text-ink-300">Line {note.line}:</span>
                  )}
                  <span className="text-sm text-ink-700">{note.message}</span>
                  {onAutoFix && (
                    <button
                      type="button"
                      onClick={() => onAutoFix(index)}
                      className="mt-1 block rounded border border-bone-200 bg-bone-100 px-2 py-0.5 text-xs font-medium text-ink-500 transition-colors hover:bg-bone-200 hover:text-ink-700"
                    >
                      Auto-fix
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {notes.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-ink-300">
          No issues found
        </div>
      )}
    </div>
  )
}
