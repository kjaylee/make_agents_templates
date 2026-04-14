'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hammer } from '@phosphor-icons/react'
import { GalleryGrid } from '@/components/gallery/galleryGrid'
import { SearchBar } from '@/components/gallery/searchBar'

interface GalleryAgent {
  slug: string
  name: string
  description: string
  model: string
  mcpServers: string[]
  toolCount: number
  skillCount: number
}

interface GalleryResponse {
  agents: GalleryAgent[]
  total: number
  page: number
  limit: number
}

export default function GalleryPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<GalleryAgent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [model, setModel] = useState('')
  const [sort, setSort] = useState('trending')

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (model) params.set('model', model)
      params.set('sort', sort)
      params.set('limit', '30')

      const res = await fetch(`/api/gallery?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: GalleryResponse = await res.json()
      setAgents(data.agents)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }, [query, model, sort])

  useEffect(() => {
    const timer = setTimeout(fetchAgents, query ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchAgents, query])

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="font-display text-xl tracking-tight text-ink-900">
          <a href="/" className="transition-colors hover:text-ember-500">Forge</a>
        </div>
        <nav className="flex items-center gap-6 text-sm text-ink-500">
          <a className="text-ink-900 font-medium" href="/gallery">Gallery</a>
          <a className="transition-colors hover:text-ink-900" href="/docs">Docs</a>
          <a className="transition-colors hover:text-ink-900" href="/pricing">Pricing</a>
          <button
            type="button"
            onClick={() => router.push('/forge')}
            className="rounded bg-ember-500 px-4 py-2 text-bone-50 shadow-ember transition-transform hover:-translate-y-px hover:bg-ember-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500"
          >
            Start forging
          </button>
        </nav>
      </header>

      {/* Page title */}
      <section className="mt-12 mb-8">
        <h1 className="font-display text-4xl tracking-tight text-ink-900">
          Agent Gallery
        </h1>
        <p className="mt-2 text-ink-500">
          Browse community-forged AI agents. Fork any template to start.
        </p>
      </section>

      {/* Search / filter bar */}
      <div className="mb-8">
        <SearchBar
          query={query}
          model={model}
          sort={sort}
          onQueryChange={setQuery}
          onModelChange={setModel}
          onSortChange={setSort}
        />
      </div>

      {/* Result count */}
      {!loading && !error && (
        <p className="mb-4 text-sm text-ink-300">
          {total} agent{total !== 1 ? 's' : ''}
          {query ? ` matching "${query}"` : ''}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Hammer size={32} weight="duotone" className="animate-bounce text-ember-500" />
        </div>
      ) : error ? (
        <div className="rounded border border-rust-500/20 bg-rust-500/5 px-4 py-3 text-sm text-rust-500">
          {error}
        </div>
      ) : (
        <GalleryGrid agents={agents} />
      )}

      {/* Footer */}
      <footer className="mt-24 border-t border-bone-200 pt-6 text-xs text-ink-500">
        <div className="flex justify-between">
          <span>Crafted in fire · Deployed in a click</span>
          <span className="font-mono">v0.0.0 · skeleton</span>
        </div>
      </footer>
    </main>
  )
}
