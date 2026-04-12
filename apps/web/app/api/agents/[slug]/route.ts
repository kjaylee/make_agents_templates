import { type NextRequest } from 'next/server'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { handleApiError, ApiError } from '@/lib/apiError'

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

function getSeedsDir(): string {
  return join(process.cwd(), '..', '..', 'docs', 'seeds')
}

function findAgentBySlug(slug: string): { agent: SeedAgent; yaml: string } | null {
  const seedsDir = getSeedsDir()
  const files = readdirSync(seedsDir).filter((f) => f.endsWith('.yaml'))

  for (const filename of files) {
    const content = readFileSync(join(seedsDir, filename), 'utf-8')
    const seed = parseYaml(content) as SeedAgent
    if (seed.metadata.template === slug) {
      return { agent: seed, yaml: content }
    }
  }

  return null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const result = findAgentBySlug(slug)

    if (!result) {
      throw new ApiError('NOT_FOUND', 'Agent not found', 404)
    }

    const { agent, yaml } = result

    return Response.json({
      slug: agent.metadata.template,
      name: agent.name,
      description: agent.description,
      model: agent.model,
      mcpServers: agent.mcp_servers ?? [],
      tools: agent.tools,
      skills: agent.skills ?? [],
      yaml
    })
  } catch (error) {
    return handleApiError(error)
  }
}
