'use client'

interface GalleryAgent {
  slug: string
  name: string
  description: string
  model: string
  mcpServers: string[]
  toolCount: number
  skillCount: number
}

interface GalleryCardProps {
  agent: GalleryAgent
}

function modelShortName(model: string): string {
  if (model.includes('opus')) return 'Opus'
  if (model.includes('sonnet')) return 'Sonnet'
  if (model.includes('haiku')) return 'Haiku'
  return model
}

function modelColor(model: string): string {
  if (model.includes('opus')) return 'bg-ember-500 text-bone-50'
  if (model.includes('sonnet')) return 'bg-iron-600 text-bone-50'
  return 'bg-bone-200 text-ink-700'
}

export function GalleryCard({ agent }: GalleryCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded border border-bone-200 bg-bone-50 shadow-anvil transition-shadow hover:shadow-ember">
      {/* Top strip — model badge + MCP icons — 16:10 ratio header area */}
      <div className="relative flex aspect-[16/10] flex-col justify-between bg-bone-100 p-4">
        {/* Model badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${modelColor(agent.model)}`}
          >
            {modelShortName(agent.model)}
          </span>
          {agent.mcpServers.length > 0 && (
            <span className="text-xs text-ink-300">
              {agent.mcpServers.slice(0, 2).join(', ')}
              {agent.mcpServers.length > 2 && ` +${agent.mcpServers.length - 2}`}
            </span>
          )}
        </div>

        {/* Tool/skill counts */}
        <div className="flex items-center gap-3 text-xs text-ink-300">
          <span>{agent.toolCount} tool{agent.toolCount !== 1 ? 's' : ''}</span>
          {agent.skillCount > 0 && (
            <span>{agent.skillCount} skill{agent.skillCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Bottom — title, description, forks */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-medium leading-snug text-ink-900 group-hover:text-ember-500 transition-colors">
          {agent.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-500">
          {agent.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="font-mono text-xs text-ink-300">{agent.slug}</span>
          <a
            href={`/forge?template=${encodeURIComponent(agent.slug)}`}
            className="rounded bg-ember-500 px-3 py-1 text-xs text-bone-50 shadow-ember transition-transform hover:-translate-y-px hover:bg-ember-600"
          >
            Fork
          </a>
        </div>
      </div>
    </article>
  )
}
