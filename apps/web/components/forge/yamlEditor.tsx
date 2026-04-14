'use client'

import { ClipboardText, Check, Rocket } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface YamlEditorProps {
  yaml: string
  lintScore: number | null
  lintNotes: { severity: 'info' | 'warn' | 'error'; message: string }[]
  isStreaming: boolean
}

function addLineNumbers(code: string): { number: number; text: string }[] {
  const lines = code.split('\n')
  return lines.map((text, i) => ({ number: i + 1, text }))
}

function highlightYaml(text: string): string {
  return text
    .replace(/(#.*$)/gm, '<span class="text-ink-300">$1</span>')
    .replace(/^(\s*)([\w.-]+)(:)/gm, '$1<span class="text-iron-600">$2</span><span class="text-ink-500">$3</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="text-jade-500">$1</span>')
    .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="text-jade-500">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="text-ember-600">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-ember-600">$1</span>')
}

export function YamlEditor({ yaml, lintScore, lintNotes, isStreaming }: YamlEditorProps) {
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [yaml, isStreaming])

  const handleCopy = useCallback(async () => {
    if (!yaml) return
    await navigator.clipboard.writeText(yaml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [yaml])

  const lintVariant =
    lintScore !== null
      ? lintScore >= 80
        ? 'success' as const
        : lintScore >= 50
          ? 'default' as const
          : 'error' as const
      : 'default' as const

  if (!yaml && !isStreaming) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-bone-100 p-8">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className="mb-6 text-ink-300"
        >
          <path
            d="M8 48h48v4a4 4 0 01-4 4H12a4 4 0 01-4-4v-4z"
            fill="currentColor"
            opacity="0.3"
          />
          <path
            d="M16 36h32a4 4 0 014 4v8H12v-8a4 4 0 014-4z"
            fill="currentColor"
            opacity="0.5"
          />
          <path
            d="M20 24h24a8 8 0 018 8v4H12v-4a8 8 0 018-8z"
            fill="currentColor"
            opacity="0.7"
          />
          <rect x="28" y="8" width="8" height="16" rx="2" fill="currentColor" />
        </svg>
        <p className="text-center text-sm text-ink-300">
          Your agent will appear here
        </p>
      </div>
    )
  }

  const lines = addLineNumbers(yaml)

  return (
    <div className="relative flex h-full flex-col bg-bone-50">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 border-b border-bone-200 px-4 py-2">
        {lintScore !== null && (
          <Badge variant={lintVariant}>
            {lintScore} / 100
            {lintNotes.length > 0 && ` \u00b7 ${lintNotes.length} suggestion${lintNotes.length !== 1 ? 's' : ''}`}
          </Badge>
        )}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!yaml}
          className="rounded p-1.5 text-ink-500 transition-colors hover:bg-bone-200 hover:text-ink-700 disabled:opacity-30"
          aria-label="Copy YAML"
        >
          {copied ? (
            <Check size={18} weight="bold" className="text-jade-500" />
          ) : (
            <ClipboardText size={18} weight="duotone" />
          )}
        </button>
      </div>

      {/* Code area */}
      <pre
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed"
      >
        <code>
          {lines.map((line) => (
            <div key={line.number} className="flex">
              <span className="mr-4 inline-block w-8 select-none text-right text-ink-300">
                {line.number}
              </span>
              <span
                dangerouslySetInnerHTML={{
                  __html: highlightYaml(line.text),
                }}
              />
            </div>
          ))}
        </code>
        {isStreaming && (
          <span className="inline-block h-4 w-1.5 animate-pulse bg-ember-500" />
        )}
      </pre>

      {/* Ship to Console CTA — shown when YAML is ready */}
      {yaml && !isStreaming && (
        <div className="border-t border-bone-200 px-4 py-3">
          <a
            href="#"
            onClick={(e) => { e.preventDefault() }}
            className="inline-flex w-full items-center justify-center gap-2 rounded border border-bone-200 bg-bone-100 px-4 py-2 text-sm font-medium text-ink-700 shadow-anvil transition-colors hover:bg-bone-200 hover:text-ink-900"
          >
            <Rocket size={16} weight="duotone" />
            Deploy agent
          </a>
        </div>
      )}
    </div>
  )
}
