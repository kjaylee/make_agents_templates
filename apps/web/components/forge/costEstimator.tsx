'use client'

import { CaretDown, CaretUp } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'

interface CostEstimatorProps {
  currentModel: string
}

const MODEL_PRICING = [
  {
    id: 'claude-opus-4-6',
    label: 'Quality',
    inputPer1M: 15,
    outputPer1M: 75,
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Balanced',
    inputPer1M: 3,
    outputPer1M: 15,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Fast',
    inputPer1M: 0.25,
    outputPer1M: 1.25,
  },
] as const

export function CostEstimator({ currentModel }: CostEstimatorProps) {
  const [expanded, setExpanded] = useState(false)
  const [runsPerDay, setRunsPerDay] = useState(50)
  const [avgTokens, setAvgTokens] = useState(2000)

  const costs = useMemo(() => {
    // Assume 50/50 input/output ratio
    const tokensPerRun = avgTokens
    const inputTokens = tokensPerRun * 0.5
    const outputTokens = tokensPerRun * 0.5
    const runsPerMonth = runsPerDay * 30

    return MODEL_PRICING.map((model) => {
      const inputCost = (inputTokens * runsPerMonth * model.inputPer1M) / 1_000_000
      const outputCost = (outputTokens * runsPerMonth * model.outputPer1M) / 1_000_000
      const totalCost = inputCost + outputCost
      return {
        ...model,
        monthlyCost: totalCost,
      }
    })
  }, [runsPerDay, avgTokens])

  const maxCost = Math.max(...costs.map((c) => c.monthlyCost), 1)

  return (
    <div className="rounded border border-bone-200 bg-bone-50">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-bone-100"
      >
        Monthly Cost Estimate
        {expanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
      </button>

      {expanded && (
        <div className="border-t border-bone-200 px-4 py-4">
          {/* Bar chart */}
          <div className="flex flex-col gap-3">
            {costs.map((model) => (
              <div key={model.id} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs font-medium text-ink-500">
                  {model.label}
                </span>
                <div className="flex-1">
                  <div className="h-5 w-full overflow-hidden rounded bg-bone-200">
                    <div
                      className={`h-full rounded transition-all ${
                        model.id === currentModel ? 'bg-ember-500' : 'bg-ink-300'
                      }`}
                      style={{
                        width: `${Math.max(2, (model.monthlyCost / maxCost) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-20 shrink-0 text-right text-xs font-medium text-ink-700">
                  ${model.monthlyCost.toFixed(2)}/mo
                </span>
              </div>
            ))}
          </div>

          {/* Assumption text */}
          <p className="mt-3 text-xs text-ink-300">
            Based on: {runsPerDay} runs/day, avg {avgTokens.toLocaleString()} tokens
          </p>

          {/* Sliders */}
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-xs text-ink-500">
                <span>Runs per day</span>
                <span>{runsPerDay}</span>
              </div>
              <input
                type="range"
                min={1}
                max={500}
                value={runsPerDay}
                onChange={(e) => setRunsPerDay(Number(e.target.value))}
                className="mt-1 w-full accent-ember-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-ink-500">
                <span>Avg tokens per run</span>
                <span>{avgTokens.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={500}
                max={10000}
                step={100}
                value={avgTokens}
                onChange={(e) => setAvgTokens(Number(e.target.value))}
                className="mt-1 w-full accent-ember-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
