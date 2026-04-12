'use client'

import { useCallback, useState } from 'react'
import { DownloadSimple, CaretDown, CaretRight } from '@phosphor-icons/react'
import { stringify } from 'csv-stringify/browser/esm/sync'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface FuzzCase {
  id: string
  category: 'adversarial' | 'ambiguous' | 'empty' | 'injection'
  input: string
  output?: string
  passed: boolean
  notes?: string
}

export interface FuzzResultsData {
  score: number
  passed: number
  failed: number
  categories: {
    adversarial: { passed: number; total: number }
    ambiguous: { passed: number; total: number }
    empty: { passed: number; total: number }
    injection: { passed: number; total: number }
  }
  cases: FuzzCase[]
}

interface FuzzResultsProps {
  data: FuzzResultsData
  agentSlug: string
}

const CATEGORY_LABELS: Record<keyof FuzzResultsData['categories'], string> = {
  adversarial: 'Adversarial',
  ambiguous: 'Ambiguous',
  empty: 'Empty',
  injection: 'Injection',
}

function CategoryBar({ label, passed, total }: { label: string; passed: number; total: number }) {
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-ink-700">{label}</span>
        <span className="font-mono text-ink-500">
          {passed}/{total} · {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bone-200">
        <div className="h-full bg-jade-500 transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function FuzzResults({ data, agentSlug }: FuzzResultsProps) {
  const [expandedFailures, setExpandedFailures] = useState(false)

  const failures = data.cases.filter((c) => !c.passed)

  const handleDownloadCsv = useCallback(() => {
    const rows = data.cases.map((c) => ({
      id: c.id,
      category: c.category,
      passed: c.passed ? 'yes' : 'no',
      input: c.input,
      output: c.output ?? '',
      notes: c.notes ?? '',
    }))
    const csv = stringify(rows, {
      header: true,
      columns: ['id', 'category', 'passed', 'input', 'output', 'notes'],
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fuzz-${agentSlug}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [data.cases, agentSlug])

  const scoreColor =
    data.score >= 80 ? 'text-jade-500' : data.score >= 50 ? 'text-gold-500' : 'text-rust-500'

  return (
    <section className="rounded border border-bone-200 bg-bone-50 p-6 shadow-anvil">
      <div className="flex items-end gap-8">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-500">Score</div>
          <div className={`font-display text-6xl tracking-tight ${scoreColor}`}>
            {data.score}
            <span className="text-3xl text-ink-300">/100</span>
          </div>
        </div>
        <div className="flex items-center gap-3 pb-2">
          <Badge variant="success">{data.passed} passed</Badge>
          <Badge variant="error">{data.failed} failed</Badge>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {(Object.keys(CATEGORY_LABELS) as Array<keyof FuzzResultsData['categories']>).map((key) => (
          <CategoryBar
            key={key}
            label={CATEGORY_LABELS[key]}
            passed={data.categories[key].passed}
            total={data.categories[key].total}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button size="sm" variant="secondary" onClick={handleDownloadCsv}>
          <DownloadSimple size={14} weight="duotone" />
          Download CSV
        </Button>
        {failures.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpandedFailures((v) => !v)}
          >
            {expandedFailures ? (
              <CaretDown size={14} weight="bold" />
            ) : (
              <CaretRight size={14} weight="bold" />
            )}
            View failures ({failures.length})
          </Button>
        )}
      </div>

      {expandedFailures && failures.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-bone-200 pt-4">
          {failures.map((c) => (
            <li key={c.id} className="rounded border border-rust-500/20 bg-rust-500/5 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="error">{c.category}</Badge>
                <span className="font-mono text-[10px] text-ink-500">{c.id}</span>
              </div>
              <div className="mt-2 space-y-1 text-xs text-ink-700">
                <div>
                  <span className="text-ink-500">Input:</span>{' '}
                  <code className="font-mono">{c.input.slice(0, 120)}</code>
                </div>
                {c.notes && (
                  <div>
                    <span className="text-ink-500">Why failed:</span> {c.notes}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
