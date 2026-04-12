'use client'

import { useCallback, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Sword, Flame } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { BattleArena, type BattleSide } from '@/components/battle/battleArena'
import { JudgeCard, type Verdict } from '@/components/battle/judgeCard'
import { BattleOgCard } from '@/components/battle/battleOgCard'
import type { SandboxEvent } from '@/lib/managedAgents'

type Phase = 'idle' | 'running' | 'done' | 'error'

const EMPTY_SIDE: Omit<BattleSide, 'slug' | 'name' | 'model'> = {
  events: [] as SandboxEvent[],
  output: '',
  tokens: 0,
  costUsd: 0,
  isRunning: false,
}

export default function BattlePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()

  // Read agent slugs from ?a= and ?b= query params; fall back to defaults.
  const agentASlugParam = searchParams.get('a') ?? 'incident-commander'
  const agentBSlugParam = searchParams.get('b') ?? 'triage-v2'

  const [input, setInput] = useState(
    'P0 outage in payment service. Checkout returning 500s since 14:28 UTC.',
  )
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const [agentA, setAgentA] = useState<BattleSide>({
    slug: agentASlugParam,
    name: agentASlugParam,
    model: 'Opus 4.6',
    ...EMPTY_SIDE,
  })
  const [agentB, setAgentB] = useState<BattleSide>({
    slug: agentBSlugParam,
    name: agentBSlugParam,
    model: 'Sonnet 4.6',
    ...EMPTY_SIDE,
  })
  const [verdict, setVerdict] = useState<Verdict | null>(null)

  const startBattle = useCallback(async () => {
    setPhase('running')
    setError(null)
    setVerdict(null)
    setAgentA((a) => ({ ...a, ...EMPTY_SIDE, isRunning: true }))
    setAgentB((b) => ({ ...b, ...EMPTY_SIDE, isRunning: true }))

    try {
      const res = await fetch('/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentASlug: agentA.slug,
          agentBSlug: agentB.slug,
          input,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }

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
              case 'agent_a_event':
                setAgentA((a) => ({ ...a, events: [...a.events, event.data] }))
                break
              case 'agent_b_event':
                setAgentB((b) => ({ ...b, events: [...b.events, event.data] }))
                break
              case 'agent_a_done':
                setAgentA((a) => ({
                  ...a,
                  output: event.data.output ?? a.output,
                  tokens: event.data.tokens ?? a.tokens,
                  costUsd: event.data.costUsd ?? a.costUsd,
                  isRunning: false,
                }))
                break
              case 'agent_b_done':
                setAgentB((b) => ({
                  ...b,
                  output: event.data.output ?? b.output,
                  tokens: event.data.tokens ?? b.tokens,
                  costUsd: event.data.costUsd ?? b.costUsd,
                  isRunning: false,
                }))
                break
              case 'verdict':
                setVerdict({
                  winner: event.data.winner,
                  scoreA: event.data.scoreA,
                  scoreB: event.data.scoreB,
                  notes: event.data.notes,
                  agentAName: agentA.name,
                  agentBName: agentB.name,
                })
                break
              case 'done':
                setPhase('done')
                break
              case 'error':
                throw new Error(event.data ?? 'Battle failed')
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue
            throw e
          }
        }
      }

      setAgentA((a) => ({ ...a, isRunning: false }))
      setAgentB((b) => ({ ...b, isRunning: false }))
      setPhase((p) => (p === 'running' ? 'done' : p))
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Battle failed')
      setAgentA((a) => ({ ...a, isRunning: false }))
      setAgentB((b) => ({ ...b, isRunning: false }))
    }
  }, [agentA.slug, agentA.name, agentB.slug, agentB.name, input])

  const handleShare = useCallback(() => {
    // Open the OG image in a new tab so the user can save or copy it for sharing.
    const ogUrl = `${window.location.origin}/api/battle/${params.id}/og`
    window.open(ogUrl, '_blank', 'noopener,noreferrer')
  }, [params.id])

  return (
    <main className="min-h-screen bg-bone-100 bg-paper-grain">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <Sword size={28} weight="duotone" className="text-ember-500" />
            <h1 className="font-display text-3xl tracking-tight text-ink-900">
              Battle: <span className="text-ember-500">{agentA.name}</span>
              <span className="mx-2 text-ink-300">vs</span>
              <span className="text-iron-600">{agentB.name}</span>
            </h1>
          </div>
          {/* Agent picker info — populated from ?a= and ?b= query params */}
          <div className="mt-2 flex items-center gap-2 text-sm text-ink-500">
            <span>Battling:</span>
            <a
              href={`/gallery/${agentA.slug}`}
              className="font-medium text-ember-500 hover:underline"
            >
              {agentA.name}
            </a>
            <span className="text-ink-300">vs</span>
            <a
              href={`/gallery/${agentB.slug}`}
              className="font-medium text-iron-600 hover:underline"
            >
              {agentB.name}
            </a>
          </div>
        </header>

        <section className="mb-8 rounded border border-bone-200 bg-bone-50 p-5 shadow-anvil">
          <label className="text-[10px] uppercase tracking-wider text-ink-500">Input</label>
          <Textarea
            className="mt-2"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={phase === 'running'}
          />
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={startBattle} disabled={phase === 'running' || !input.trim()}>
              {phase === 'running' ? (
                <>
                  <Flame size={16} weight="duotone" className="animate-pulse" />
                  Battling…
                </>
              ) : (
                <>
                  <Sword size={16} weight="duotone" />
                  Start Battle
                </>
              )}
            </Button>
            {error && <span className="text-sm text-rust-500">{error}</span>}
          </div>
        </section>

        <BattleArena agentA={agentA} agentB={agentB} />

        {verdict && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto]">
            <JudgeCard verdict={verdict} onShare={handleShare} />
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500">
                Share card preview
              </div>
              <BattleOgCard verdict={verdict} scale={0.25} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
