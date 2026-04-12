'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useState } from 'react'
import { HammerAnimation } from '@/components/forge/hammerAnimation'
import { IntentPanel } from '@/components/forge/intentPanel'
import { MonacoEditor } from '@/components/forge/monacoEditor'
import { LintPanel } from '@/components/forge/lintPanel'
import { CostEstimator } from '@/components/forge/costEstimator'
import { useForgeStream } from '@/hooks/useForgeStream'

function ForgeComposerInner() {
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get('prompt') ?? ''
  const { state, yaml, lintScore, lintNotes, error, forge } = useForgeStream()
  const [showHammer, setShowHammer] = useState(false)
  const [editedYaml, setEditedYaml] = useState('')

  const currentYaml = editedYaml || yaml

  // Auto-fix handler — removes the problematic line from YAML (MVP approach)
  const handleAutoFix = useCallback(
    (noteIndex: number) => {
      const note = lintNotes[noteIndex]
      if (!note || note.line === undefined) return
      const lines = currentYaml.split('\n')
      // Remove the offending line (note.line is 1-based)
      lines.splice(note.line - 1, 1)
      setEditedYaml(lines.join('\n'))
    },
    [lintNotes, currentYaml]
  )

  // Derive model from YAML for cost estimator
  const currentModel = (() => {
    const match = currentYaml.match(/^model:\s*(.+)$/m)
    return match?.[1]?.trim() ?? 'claude-sonnet-4-6'
  })()

  const handleForge = useCallback(
    (intent: {
      prompt: string
      mcpHints: string[]
      modelPreference: 'speed' | 'balance' | 'quality'
    }) => {
      setShowHammer(true)
    // We store intent and fire after animation
      const fireForge = () => {
        setShowHammer(false)
        forge(intent)
      }
      // Delay to let hammer animation complete
      setTimeout(fireForge, 1000)
    },
    [forge]
  )

  const isForging = state === 'forging' || state === 'streaming' || showHammer

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-bone-200 px-6 py-3">
        <a
          href="/"
          className="font-display text-xl tracking-tight text-ink-900"
        >
          Forge
        </a>
        <nav className="flex items-center gap-4 text-sm text-ink-500">
          <a className="transition-colors hover:text-ink-900" href="/gallery">
            Gallery
          </a>
          <a className="transition-colors hover:text-ink-900" href="/docs">
            Docs
          </a>
        </nav>
      </header>

      {/* Main split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Intent (40%) */}
        <div className="w-[40%] border-r border-bone-200 overflow-y-auto">
          <IntentPanel
            onForge={handleForge}
            isForging={isForging}
            initialPrompt={initialPrompt}
          />
        </div>

        {/* Right panel — Monaco Editor + Lint + Cost (60%) */}
        <div className="flex w-[60%] flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              value={currentYaml}
              onChange={setEditedYaml}
              lintNotes={lintNotes}
              lintScore={lintScore}
              isStreaming={state === 'streaming'}
            />
          </div>

          {/* Lint panel — only when lint data exists */}
          {lintScore !== null && (
            <div className="shrink-0 border-t border-bone-200 p-4">
              <LintPanel lintScore={lintScore} notes={lintNotes} onAutoFix={handleAutoFix} />
            </div>
          )}

          {/* Cost estimator — collapsible */}
          {currentYaml && !state.startsWith('forg') && (
            <div className="shrink-0 border-t border-bone-200 p-4">
              <CostEstimator currentModel={currentModel} />
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="border-t border-rust-500/20 bg-rust-500/10 px-6 py-3 text-sm text-rust-500">
          {error}
        </div>
      )}

      {/* Hammer animation overlay */}
      <HammerAnimation
        isActive={showHammer}
        onComplete={() => setShowHammer(false)}
      />
    </div>
  )
}

export default function ForgeComposerPage() {
  return (
    <Suspense>
      <ForgeComposerInner />
    </Suspense>
  )
}
