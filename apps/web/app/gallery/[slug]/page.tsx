'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, GitFork, Rocket, Flask, Flame, Sword, Bug, TreeStructure } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CanaryToggle } from '@/components/nocturnal/canaryToggle'

interface AgentDetail {
  slug: string
  name: string
  description: string
  model: string
  mcpServers: { name: string; type: string; url: string }[]
  tools: { type: string }[]
  skills: { type: string; skill_id: string }[]
  yaml: string
}

function modelShortName(model: string): string {
  if (model.includes('opus')) return 'Opus'
  if (model.includes('sonnet')) return 'Sonnet'
  if (model.includes('haiku')) return 'Haiku'
  return model
}

function modelBadgeColor(model: string): 'default' | 'secondary' {
  if (model.includes('opus')) return 'default'
  return 'secondary'
}

function highlightYaml(text: string): string {
  return text
    .replace(/(#.*$)/gm, '<span class="text-ink-300">$1</span>')
    .replace(/^(\s*)([\w.-]+)(:)/gm, '$1<span class="text-iron-600">$2</span><span class="text-ink-500">$3</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="text-jade-500">$1</span>')
    .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="text-jade-500">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="text-ember-600">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-ember-600">$1</span>')
}

export default function AgentDetailPage() {
  const params = useParams<{ slug: string }>()
  const [agent, setAgent] = useState<AgentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${params.slug}`)
        if (!res.ok) throw new Error('Agent not found')
        const data: AgentDetail = await res.json()
        setAgent(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent')
      } finally {
        setLoading(false)
      }
    }
    fetchAgent()
  }, [params.slug])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bone-100">
        <Flame size={32} weight="duotone" className="animate-pulse text-ember-500" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bone-100">
        <p className="text-ink-500">{error ?? 'Agent not found'}</p>
        <a href="/gallery" className="mt-4 text-sm text-ember-500 hover:underline">
          Back to Gallery
        </a>
      </div>
    )
  }

  const lines = agent.yaml.split('\n')

  return (
    <main className="min-h-screen bg-bone-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Back link */}
        <a
          href="/gallery"
          className="mb-8 inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft size={16} />
          Back to Gallery
        </a>

        {/* Agent header card */}
        <div className="mt-4 rounded border border-bone-200 bg-bone-50 p-8 shadow-anvil">
          {/* Title + description */}
          <h1 className="font-display text-3xl tracking-tight text-ink-900">{agent.name}</h1>
          <p className="mt-2 text-ink-500">{agent.description}</p>

          {/* Meta badges */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge variant={modelBadgeColor(agent.model)}>
              {modelShortName(agent.model)}
            </Badge>
            {agent.mcpServers.map((mcp) => (
              <Badge key={mcp.name} variant="outline">{mcp.name}</Badge>
            ))}
            <span className="text-xs text-ink-300">
              {agent.tools.length} tool{agent.tools.length !== 1 ? 's' : ''}
            </span>
            {agent.skills.length > 0 && (
              <span className="text-xs text-ink-300">
                {agent.skills.length} skill{agent.skills.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="primary" size="sm">
              <a href={`/forge?template=${encodeURIComponent(agent.slug)}`}>
                <GitFork size={16} weight="duotone" />
                Fork
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href={`https://console.anthropic.com?yaml=${encodeURIComponent(agent.yaml.slice(0, 1000))}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Rocket size={16} weight="duotone" />
                Ship to Console
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={`/forge/${agent.slug}/test`}>
                <Flask size={16} weight="duotone" />
                Test in Sandbox
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={`/battle/new?a=${encodeURIComponent(agent.slug)}`}>
                <Sword size={16} weight="duotone" />
                Battle
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={`/gallery/${agent.slug}/fuzz`}>
                <Bug size={16} weight="duotone" />
                Run Fuzzer
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={`/gallery/${agent.slug}/lineage`}>
                <TreeStructure size={16} weight="duotone" />
                View Lineage
              </a>
            </Button>
          </div>
        </div>

        {/* YAML display */}
        <div className="mt-8 rounded border border-bone-200 bg-bone-50 shadow-anvil">
          <div className="border-b border-bone-200 px-6 py-3">
            <span className="text-sm font-medium text-ink-700">Agent YAML</span>
          </div>
          <pre className="overflow-auto p-6 font-mono text-sm leading-relaxed">
            <code>
              {lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="mr-4 inline-block w-8 select-none text-right text-ink-300">
                    {i + 1}
                  </span>
                  <span
                    dangerouslySetInnerHTML={{ __html: highlightYaml(line) }}
                  />
                </div>
              ))}
            </code>
          </pre>
        </div>

        {/* Nightly canary */}
        <div className="mt-8">
          <CanaryToggle agentSlug={agent.slug} />
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-bone-200 pt-6 text-xs text-ink-500">
          <div className="flex justify-between">
            <span>Crafted in fire &middot; Deployed in a click</span>
            <span className="font-mono">v0.0.0 &middot; skeleton</span>
          </div>
        </footer>
      </div>
    </main>
  )
}
