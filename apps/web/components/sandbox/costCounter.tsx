'use client'

interface CostCounterProps {
  tokensIn: number
  tokensOut: number
  costCents: number
  durationMs: number
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function CostCounter({ tokensIn, tokensOut, costCents, durationMs }: CostCounterProps) {
  if (tokensIn === 0 && tokensOut === 0) return null

  return (
    <div className="flex items-center gap-4 border-t border-bone-200 bg-bone-200 px-6 py-2 font-mono text-xs text-ink-700">
      <span>{formatNumber(tokensIn)} in</span>
      <span className="text-ink-300">&middot;</span>
      <span>{formatNumber(tokensOut)} out</span>
      <span className="text-ink-300">&middot;</span>
      <span>{formatCost(costCents)}</span>
      <span className="text-ink-300">&middot;</span>
      <span>{formatDuration(durationMs)}</span>
    </div>
  )
}
