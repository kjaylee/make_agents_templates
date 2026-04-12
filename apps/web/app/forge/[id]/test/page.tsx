'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Flame } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { SandboxPanel } from '@/components/sandbox/sandboxPanel'
import { TraceViewer } from '@/components/sandbox/traceViewer'
import { CostCounter } from '@/components/sandbox/costCounter'
import type { SandboxEvent, DoneData } from '@/lib/managedAgents'

interface AgentMeta {
  slug: string
  name: string
  description: string
  model: string
  mcpServers: { name: string }[]
  yaml: string
}

export default function SandboxTestPage() {
  const params = useParams<{ id: string }>()
  const [agent, setAgent] = useState<AgentMeta | null>(null)
  const [loading, setLoading] = useState(true)

  const [events, setEvents] = useState<SandboxEvent[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [tokensIn, setTokensIn] = useState(0)
  const [tokensOut, setTokensOut] = useState(0)
  const [costCents, setCostCents] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Fetch agent metadata
  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${params.id}`)
        if (!res.ok) throw new Error('Agent not found')
        const data: AgentMeta = await res.json()
        setAgent(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent')
      } finally {
        setLoading(false)
      }
    }
    fetchAgent()
  }, [params.id])

  // Timer for duration while running
  useEffect(() => {
    if (!isRunning) return
    const startTime = Date.now()
    const interval = setInterval(() => {
      setDurationMs(Date.now() - startTime)
    }, 100)
    return () => clearInterval(interval)
  }, [isRunning])

  const handleRun = useCallback(async (input: string) => {
    if (!agent) return
    setIsRunning(true)
    setEvents([])
    setTokensIn(0)
    setTokensOut(0)
    setCostCents(0)
    setDurationMs(0)
    setError(null)

    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentYaml: agent.yaml, input }),
      })

      if (!res.ok) {
        const errBody = await res.json()
        throw new Error(errBody.error?.message ?? `HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const json = trimmed.slice(6)
          const event: SandboxEvent = JSON.parse(json)
          setEvents((prev) => [...prev, event])

          if (event.type === 'done') {
            const d = event.data as DoneData
            setTokensIn(d.totalTokensIn)
            setTokensOut(d.totalTokensOut)
            setCostCents(d.costCents)
            setDurationMs(d.duration_ms)
          }

          if (event.type === 'error') {
            setError((event.data as { message: string }).message)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sandbox execution failed')
    } finally {
      setIsRunning(false)
    }
  }, [agent])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bone-100">
        <Flame size={32} weight="duotone" className="animate-pulse text-ember-500" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bone-100">
        <p className="text-ink-500">{error ?? 'Agent not found'}</p>
        <a href="/gallery" className="mt-4 text-sm text-ember-500 hover:underline">
          Back to Gallery
        </a>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-bone-100">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-bone-200 bg-bone-50 px-6 py-3">
        <a
          href={`/gallery/${agent.slug}`}
          className="text-ink-300 transition-colors hover:text-ink-700"
        >
          <ArrowLeft size={20} />
        </a>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-lg text-ink-900">{agent.name}</h1>
          <Badge variant="secondary">{agent.model}</Badge>
          {agent.mcpServers.map((mcp) => (
            <Badge key={mcp.name} variant="outline">{mcp.name}</Badge>
          ))}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sandbox panel (40%) */}
        <div className="w-[40%] border-r border-bone-200 overflow-y-auto bg-bone-50">
          <SandboxPanel onRun={handleRun} isRunning={isRunning} />
        </div>

        {/* Right: Trace viewer (60%) */}
        <div className="relative w-[60%]">
          <TraceViewer events={events} isRunning={isRunning} />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="border-t border-rust-500/20 bg-rust-500/10 px-6 py-2 text-sm text-rust-500">
          {error}
        </div>
      )}

      {/* Cost counter */}
      <CostCounter
        tokensIn={tokensIn}
        tokensOut={tokensOut}
        costCents={costCents}
        durationMs={durationMs}
      />
    </div>
  )
}
