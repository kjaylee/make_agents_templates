'use client'

import { useCallback, useRef } from 'react'

interface SearchBarProps {
  query: string
  model: string
  sort: string
  onQueryChange: (q: string) => void
  onModelChange: (m: string) => void
  onSortChange: (s: string) => void
}

const MODELS = [
  { value: '', label: 'All models' },
  { value: 'claude-opus-4-6', label: 'Opus' },
  { value: 'claude-sonnet-4-6', label: 'Sonnet' },
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku' },
]

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'recent', label: 'Recent' },
  { value: 'forks', label: 'Most forked' },
]

export function SearchBar({
  query,
  model,
  sort,
  onQueryChange,
  onModelChange,
  onSortChange,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = useCallback(() => {
    onQueryChange('')
    inputRef.current?.focus()
  }, [onQueryChange])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search input */}
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search agents..."
          className="w-full rounded border border-bone-200 bg-bone-50 px-3 py-2 text-sm text-ink-700 shadow-anvil placeholder:text-ink-300 focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-100"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-300 hover:text-ink-700"
            aria-label="Clear search"
          >
            x
          </button>
        )}
      </div>

      {/* Model filter */}
      <select
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        className="rounded border border-bone-200 bg-bone-50 px-3 py-2 text-sm text-ink-700 shadow-anvil focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-100"
      >
        {MODELS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="rounded border border-bone-200 bg-bone-50 px-3 py-2 text-sm text-ink-700 shadow-anvil focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-100"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}
