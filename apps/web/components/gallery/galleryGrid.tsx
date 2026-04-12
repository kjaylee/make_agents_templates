'use client'

import { GalleryCard } from './galleryCard'

interface GalleryAgent {
  slug: string
  name: string
  description: string
  model: string
  mcpServers: string[]
  toolCount: number
  skillCount: number
}

interface GalleryGridProps {
  agents: GalleryAgent[]
}

export function GalleryGrid({ agents }: GalleryGridProps) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-ink-300">No agents found.</p>
        <p className="mt-1 text-sm text-ink-300">Try adjusting your search or filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <GalleryCard key={agent.slug} agent={agent} />
      ))}
    </div>
  )
}
