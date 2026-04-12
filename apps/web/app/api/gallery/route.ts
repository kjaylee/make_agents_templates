import { type NextRequest } from 'next/server'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { handleApiError } from '@/lib/apiError'

export const runtime = 'nodejs'

interface SeedAgent {
  name: string
  description: string
  model: string
  system: string | string[]
  mcp_servers?: Array<{ name: string; type: string; url: string }>
  tools: Array<{ type: string }>
  skills?: Array<{ type: string; skill_id: string }>
  metadata: { template: string }
}

interface GalleryAgent {
  slug: string
  name: string
  description: string
  model: string
  mcpServers: string[]
  toolCount: number
  skillCount: number
}

function getSeedsDir(): string {
  return join(process.cwd(), '..', '..', 'docs', 'seeds')
}

function loadGalleryAgents(): GalleryAgent[] {
  const seedsDir = getSeedsDir()
  const files = readdirSync(seedsDir).filter((f) => f.endsWith('.yaml'))

  return files.map((filename) => {
    const content = readFileSync(join(seedsDir, filename), 'utf-8')
    const seed = parseYaml(content) as SeedAgent
    return {
      slug: seed.metadata.template,
      name: seed.name,
      description: seed.description,
      model: seed.model,
      mcpServers: seed.mcp_servers?.map((s) => s.name) ?? [],
      toolCount: seed.tools.length,
      skillCount: seed.skills?.length ?? 0
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const q = searchParams.get('q')?.toLowerCase() ?? ''
    const model = searchParams.get('model') ?? ''
    const sort = searchParams.get('sort') ?? 'trending'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))
    )

    let agents = loadGalleryAgents()

    // Filter by search query
    if (q) {
      agents = agents.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.slug.includes(q)
      )
    }

    // Filter by model
    if (model) {
      agents = agents.filter((a) => a.model === model)
    }

    // Sort — per DESIGN.md spec: trending/recent/forks
    switch (sort) {
      case 'forks':
        // most forks first (toolCount used as proxy since we don't have real fork data)
        agents.sort((a, b) => b.toolCount - a.toolCount)
        break
      case 'recent':
        // newest first — use slug alphabetically as proxy (seeds don't have timestamps)
        agents.sort((a, b) => b.slug.localeCompare(a.slug))
        break
      case 'trending':
      default:
        // trending = most forks
        agents.sort((a, b) => b.toolCount - a.toolCount)
        break
    }

    const total = agents.length
    const start = (page - 1) * limit
    const paginated = agents.slice(start, start + limit)

    return Response.json({
      agents: paginated,
      total,
      page,
      limit
    })
  } catch (error) {
    return handleApiError(error)
  }
}
