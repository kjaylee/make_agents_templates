'use client'

import { Badge } from '@/components/ui/badge'
import { TraceViewer } from '@/components/sandbox/traceViewer'
import type { SandboxEvent } from '@/lib/managedAgents'

export interface BattleSide {
  slug: string
  name: string
  model: string
  events: SandboxEvent[]
  output: string
  tokens: number
  costUsd: number
  isRunning: boolean
}

interface BattleArenaProps {
  agentA: BattleSide
  agentB: BattleSide
}

function SideColumn({ side, label }: { side: BattleSide; label: string }) {
  return (
    <section className="flex flex-1 flex-col rounded border border-bone-200 bg-bone-50 shadow-anvil">
      <header className="flex items-center justify-between border-b border-bone-200 px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
          <h3 className="font-display text-lg tracking-tight text-ink-900">{side.name}</h3>
        </div>
        <Badge variant="secondary">{side.model}</Badge>
      </header>
      <div className="h-[320px] border-b border-bone-200">
        <TraceViewer events={side.events} isRunning={side.isRunning} />
      </div>
      <div className="space-y-2 px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider text-ink-500">Output preview</div>
        <p className="line-clamp-3 text-xs text-ink-700">
          {side.output || (side.isRunning ? 'Running…' : 'Awaiting response')}
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-bone-200 px-4 py-2 font-mono text-[11px] text-ink-500">
        <span>{side.tokens.toLocaleString()} tokens</span>
        <span>${side.costUsd.toFixed(2)}</span>
      </div>
    </section>
  )
}

export function BattleArena({ agentA, agentB }: BattleArenaProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <SideColumn side={agentA} label="Agent A" />
      <SideColumn side={agentB} label="Agent B" />
    </div>
  )
}
