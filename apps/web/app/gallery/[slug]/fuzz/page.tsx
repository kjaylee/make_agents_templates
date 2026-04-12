'use client'

import { useCallback, useState } from 'react'
import { useParams } from 'next/navigation'
import { Flame } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { FuzzPanel } from '@/components/fuzzer/fuzzPanel'
import { FuzzResults, type FuzzResultsData, type FuzzCase } from '@/components/fuzzer/fuzzResults'

const TOTAL = 50

export default function FuzzPage() {
  const params = useParams<{ slug: string }>()
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [passed, setPassed] = useState(0)
  const [failed, setFailed] = useState(0)
  const [cases, setCases] = useState<FuzzCase[]>([])
  const [results, setResults] = useState<FuzzResultsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleStart = useCallback(async () => {
    setRunning(true)
    setError(null)
    setCompleted(0)
    setPassed(0)
    setFailed(0)
    setCases([])
    setResults(null)

    try {
      const res = await fetch('/api/fuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentSlug: params.slug }),
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue
          try {
            const event = JSON.parse(data)
            switch (event.type) {
              case 'progress':
                setCompleted(event.data.completed ?? 0)
                break
              case 'case_result': {
                const c: FuzzCase = event.data
                setCases((prev) => [...prev, c])
                if (c.passed) setPassed((p) => p + 1)
                else setFailed((f) => f + 1)
                setCompleted((n) => n + 1)
                break
              }
              case 'done':
                setResults(event.data as FuzzResultsData)
                break
              case 'error':
                throw new Error(event.data ?? 'Fuzz failed')
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue
            throw e
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fuzz failed')
    } finally {
      setRunning(false)
    }
  }, [params.slug])

  return (
    <main className="min-h-screen bg-bone-100 bg-paper-grain">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <a
          href={`/gallery/${params.slug}`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          ← Back to agent
        </a>

        <header className="mb-6 flex items-center gap-3">
          <Flame size={24} weight="duotone" className="text-ember-500" />
          <div>
            <h1 className="font-display text-3xl tracking-tight text-ink-900">
              Fuzzer: <span className="text-ember-500">{params.slug}</span>
            </h1>
            <div className="mt-1">
              <Badge variant="outline">50 adversarial, ambiguous, empty, injection cases</Badge>
            </div>
          </div>
        </header>

        <FuzzPanel
          running={running}
          completed={completed}
          total={TOTAL}
          passed={passed}
          failed={failed}
          onStart={handleStart}
        />

        {error && (
          <div className="mt-4 rounded border border-rust-500/20 bg-rust-500/5 px-4 py-3 text-sm text-rust-500">
            {error}
          </div>
        )}

        {results && (
          <div className="mt-6">
            <FuzzResults data={{ ...results, cases: results.cases ?? cases }} agentSlug={params.slug} />
          </div>
        )}
      </div>
    </main>
  )
}
