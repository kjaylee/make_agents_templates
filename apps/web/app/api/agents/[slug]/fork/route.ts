import { type NextRequest } from 'next/server'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { randomUUID } from 'node:crypto'
import { handleApiError, ApiError } from '@/lib/apiError'
import { requireAuth } from '@/lib/auth'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'

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

function findAgentBySlug(slug: string): SeedAgent | null {
  const seedsDir = getSeedsDir()
  const files = readdirSync(seedsDir).filter((f) => f.endsWith('.yaml'))

  for (const filename of files) {
    const content = readFileSync(join(seedsDir, filename), 'utf-8')
    const seed = parseYaml(content) as SeedAgent
    if (seed.metadata.template === slug) {
      return seed
    }
  }

  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Auth guard — fork requires authentication
    const user = await requireAuth()

    // Rate limiting — 10/min free, 30/min pro/team
    const forkLimit = user.tier === 'free'
      ? { windowMs: 60_000, max: 10 }
      : RATE_LIMITS[user.tier]
    const rateResult = checkRateLimit(`fork:${user.id}`, forkLimit)

    if (!rateResult.allowed) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many fork requests. Please wait before trying again.',
            retryAfter: rateResult.retryAfter,
          },
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateResult.retryAfter ?? 60) },
        }
      )
    }

    const { slug } = await params

    const source = findAgentBySlug(slug)

    if (!source) {
      throw new ApiError('NOT_FOUND', 'Agent not found', 404)
    }

    // Create a forked copy with a new slug
    const forkId = randomUUID().slice(0, 8)
    const forkedSlug = `${slug}-fork-${forkId}`

    const forked: SeedAgent = {
      ...source,
      name: `${source.name} (fork)`,
      metadata: { template: forkedSlug }
    }

    const yaml = stringifyYaml(forked, {
      lineWidth: 120,
      defaultStringType: 'BLOCK_LITERAL',
      defaultKeyType: 'PLAIN'
    })

    return Response.json({
      slug: forkedSlug,
      sourceSlug: slug,
      name: forked.name,
      description: forked.description,
      model: forked.model,
      yaml
    })
  } catch (error) {
    // requireAuth() throws a Response directly on 401
    if (error instanceof Response) return error
    return handleApiError(error)
  }
}
