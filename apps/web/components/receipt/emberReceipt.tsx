'use client'

import { motion } from 'framer-motion'
import { Flame } from '@phosphor-icons/react'
import { ScribeDivider } from './scribeDivider'
import { TraceTimeline, type TraceStep } from './traceTimeline'

export interface ReceiptData {
  id: string
  timestamp: string
  agent: {
    name: string
    version: string
    slug: string
  }
  model: string
  mcpServers: string[]
  costUsd: number
  durationMs: number
  tokensIn: number
  tokensOut: number
  input: string
  output: string
  trace: TraceStep[]
  forger: string
}

interface EmberReceiptProps {
  data: ReceiptData
  /** When true, disables animation (useful for PDF capture) */
  staticMode?: boolean
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-0.5 font-mono text-xs text-ink-900">{value}</div>
    </div>
  )
}

/**
 * Ember Receipt — 4:5 aspect receipt for run sharing.
 * See DESIGN.md §9.7 and docs/02-design/features/web-phase3.design.md §2.2.
 */
export function EmberReceipt({ data, staticMode = false }: EmberReceiptProps) {
  const truncatedOutput =
    data.output.length > 300 ? `${data.output.slice(0, 300)}...` : data.output

  const Wrapper = staticMode ? 'div' : motion.div
  const wrapperProps = staticMode
    ? { className: '' }
    : {
        initial: { y: '-100%', opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
      }

  return (
    <Wrapper {...wrapperProps}>
      <article
        id="ember-receipt"
        className="relative mx-auto w-full max-w-[480px] overflow-hidden rounded border border-bone-200 bg-bone-50 bg-paper-grain p-8 shadow-ember-lg"
        style={{ aspectRatio: '4 / 5' }}
      >
        {/* Anvil watermark */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ opacity: 0.12 }}
          aria-hidden="true"
        >
          <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
            <path
              d="M40 200h200v20a10 10 0 01-10 10H50a10 10 0 01-10-10v-20z"
              fill="#1A1613"
            />
            <path d="M60 160h160a15 15 0 0115 15v25H45v-25a15 15 0 0115-15z" fill="#1A1613" />
            <path d="M80 110h120a25 25 0 0125 25v25H55v-25a25 25 0 0125-25z" fill="#1A1613" />
            <rect x="120" y="50" width="40" height="60" rx="4" fill="#1A1613" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative">
          {/* Header */}
          <header className="text-center">
            <div className="inline-flex items-center gap-2">
              <Flame size={18} weight="duotone" className="text-ember-500" />
              <h2 className="font-display text-2xl tracking-tight text-ink-900">
                Ember Receipt
              </h2>
            </div>
            <p className="mt-1 font-mono text-[10px] text-ink-500">
              {data.timestamp} · run/{data.id}
            </p>
          </header>

          <ScribeDivider className="my-4" />

          {/* Meta grid */}
          <section className="grid grid-cols-2 gap-3">
            <MetaCell label="Agent" value={`${data.agent.name} ${data.agent.version}`} />
            <MetaCell label="Model" value={data.model} />
            <MetaCell
              label="MCP"
              value={data.mcpServers.length > 0 ? data.mcpServers.join(' · ') : '—'}
            />
            <MetaCell label="Cost" value={`$${data.costUsd.toFixed(2)}`} />
            <MetaCell label="Duration" value={formatDuration(data.durationMs)} />
            <MetaCell
              label="Tokens"
              value={`${data.tokensIn.toLocaleString()} / ${data.tokensOut.toLocaleString()}`}
            />
          </section>

          <ScribeDivider className="my-4" />

          {/* Input */}
          <section>
            <div className="text-[10px] uppercase tracking-wider text-ink-500">Input</div>
            <pre className="mt-1 overflow-hidden whitespace-pre-wrap break-words font-mono text-[11px] leading-snug text-ink-700">
              {data.input.length > 180 ? `${data.input.slice(0, 180)}...` : data.input}
            </pre>
          </section>

          <ScribeDivider className="my-4" />

          {/* Trace */}
          <section>
            <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-500">Trace</div>
            <TraceTimeline steps={data.trace} />
          </section>

          <ScribeDivider className="my-4" />

          {/* Output */}
          <section>
            <div className="text-[10px] uppercase tracking-wider text-ink-500">Output</div>
            <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-snug text-ink-700">
              {truncatedOutput}
            </p>
          </section>

          <ScribeDivider className="my-4" />

          {/* Footer */}
          <footer className="mt-4 grid grid-cols-3 items-center gap-2 text-[10px] text-ink-500">
            <div>
              Forged by <span className="font-mono text-ink-700">@{data.forger}</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ember-100">
                <Flame size={14} weight="duotone" className="text-ember-500" />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="flex h-10 w-10 items-center justify-center rounded border border-ink-300 bg-bone-100 font-mono text-[8px] text-ink-300">
                QR
              </div>
            </div>
          </footer>

          <div className="mt-3 text-center">
            <span className="inline-flex items-center gap-1 rounded-full border border-bone-200 bg-bone-100 px-2 py-0.5 text-[9px] uppercase tracking-wider text-ink-500">
              Made with Forge
            </span>
          </div>
        </div>
      </article>
    </Wrapper>
  )
}
