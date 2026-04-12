'use client'

import { useCallback, useRef, useState } from 'react'

interface ForgeIntent {
  prompt: string
  mcpHints?: string[]
  modelPreference?: 'speed' | 'balance' | 'quality'
}

interface LintNote {
  severity: 'info' | 'warn' | 'error'
  code: string
  message: string
  line?: number
}

interface ForgeProgress {
  stage: string
  message: string
  pct: number
}

type ForgeState = 'idle' | 'forging' | 'streaming' | 'done' | 'error'

interface UseForgeStreamReturn {
  state: ForgeState
  yaml: string
  lintScore: number | null
  lintNotes: LintNote[]
  progress: ForgeProgress | null
  error: string | null
  forge: (intent: ForgeIntent) => void
  reset: () => void
}

export function useForgeStream(): UseForgeStreamReturn {
  const [state, setState] = useState<ForgeState>('idle')
  const [yaml, setYaml] = useState('')
  const [lintScore, setLintScore] = useState<number | null>(null)
  const [lintNotes, setLintNotes] = useState<LintNote[]>([])
  const [progress, setProgress] = useState<ForgeProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState('idle')
    setYaml('')
    setLintScore(null)
    setLintNotes([])
    setProgress(null)
    setError(null)
  }, [])

  const forge = useCallback(async (intent: ForgeIntent) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState('forging')
    setYaml('')
    setLintScore(null)
    setLintNotes([])
    setProgress(null)
    setError(null)

    try {
      const res = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intent),
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      setState('streaming')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data)

            switch (event.type) {
              case 'progress':
                setProgress({
                  stage: event.data.stage,
                  message: event.data.message,
                  pct: event.data.pct,
                })
                break
              case 'yaml':
                setYaml((prev) => prev + event.data)
                break
              case 'lint':
                setLintScore(event.data.score)
                setLintNotes(event.data.notes ?? [])
                break
              case 'done':
                // final result — lint data may arrive here if not streamed separately
                if (event.data.lintScore !== undefined) {
                  setLintScore(event.data.lintScore)
                  setLintNotes(event.data.lintNotes ?? [])
                }
                break
              case 'error':
                throw new Error(event.data)
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue
            throw e
          }
        }
      }

      setState('done')
    } catch (err) {
      if (controller.signal.aborted) return
      setState('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  return { state, yaml, lintScore, lintNotes, progress, error, forge, reset }
}
