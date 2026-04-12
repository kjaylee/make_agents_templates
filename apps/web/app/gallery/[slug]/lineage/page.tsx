'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GitFork, Flame } from '@phosphor-icons/react'
import { LineageTree, type LineageNode, type LineageEdge } from '@/components/lineage/lineageTree'

interface LineageResponse {
  nodes: LineageNode[]
  edges: LineageEdge[]
  currentId: string
}

function mockLineage(slug: string): LineageResponse {
  return {
    currentId: 'v3',
    nodes: [
      { id: 'v1', slug: `${slug}-v1`, label: `${slug} v1`, kind: 'root', diffSummary: 'Initial version' },
      { id: 'v2', slug: `${slug}-v2`, label: 'v2', kind: 'version', diffSummary: 'Added sentry MCP' },
      { id: 'v2.1', slug: `${slug}-v2-1`, label: 'v2.1', kind: 'version', diffSummary: 'Tuned temperature' },
      { id: 'v2-fork-bob', slug: `${slug}-bob`, label: 'bob-fork', author: 'bob', kind: 'fork', diffSummary: 'Added linear tools' },
      { id: 'v3', slug, label: 'v3', kind: 'current', diffSummary: 'Added slack notifier' },
      { id: 'v2-fork-tuned', slug: `${slug}-bob-tuned`, label: 'bob-tuned', author: 'bob', kind: 'fork', diffSummary: 'Bob tuned further' },
    ],
    edges: [
      { id: 'e1', source: 'v1', target: 'v2' },
      { id: 'e2', source: 'v1', target: 'v2.1' },
      { id: 'e3', source: 'v1', target: 'v2-fork-bob' },
      { id: 'e4', source: 'v2', target: 'v3' },
      { id: 'e5', source: 'v2-fork-bob', target: 'v2-fork-tuned' },
    ],
  }
}

export default function LineagePage() {
  const params = useParams<{ slug: string }>()
  const [data, setData] = useState<LineageResponse | null>(null)

  useEffect(() => {
    async function fetchLineage() {
      try {
        const res = await fetch(`/api/lineage/${params.slug}`)
        if (res.ok) {
          setData(await res.json())
          return
        }
      } catch {
        // fall through to mock
      }
      setData(mockLineage(params.slug))
    }
    fetchLineage()
  }, [params.slug])

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bone-100 bg-paper-grain">
        <Flame size={32} weight="duotone" className="animate-pulse text-ember-500" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bone-100 bg-paper-grain">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <a
          href={`/gallery/${params.slug}`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          ← Back to agent
        </a>

        <header className="mb-8 flex items-center gap-3">
          <GitFork size={24} weight="duotone" className="text-ember-500" />
          <h1 className="font-display text-3xl tracking-tight text-ink-900">
            Lineage: <span className="text-ember-500">{params.slug}</span>
          </h1>
        </header>

        <LineageTree nodes={data.nodes} edges={data.edges} currentId={data.currentId} />

        <p className="mt-4 text-center text-xs text-ink-500">
          Hover a node to see diff · click to open
        </p>
      </div>
    </main>
  )
}
