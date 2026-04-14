import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import type { TaskType } from './classifier'

export interface SeedTemplate {
  name: string
  description: string
  model: string
  system: string | string[]
  mcp_servers?: Array<{ name: string; type: string; url: string }>
  tools: Array<{ type: string; mcp_server_name?: string }>
  skills?: Array<{ type: string; skill_id: string }>
  metadata: { template: string }
}

export interface SeedMatch {
  seed: SeedTemplate
  score: number
  filename: string
}

let cachedSeeds: Array<{ seed: SeedTemplate; filename: string }> | null = null

function getSeedsDir(): string {
  // Use process.cwd() which points to the workspace root in both
  // dev (Next.js Turbopack) and production builds.
  return join(process.cwd(), '..', '..', 'docs', 'seeds')
}

function loadSeeds(): Array<{ seed: SeedTemplate; filename: string }> {
  if (cachedSeeds) return cachedSeeds

  const seedsDir = getSeedsDir()
  const files = readdirSync(seedsDir).filter((f) => f.endsWith('.yaml'))

  cachedSeeds = files.map((filename) => {
    const content = readFileSync(join(seedsDir, filename), 'utf-8')
    const seed = parseYaml(content) as SeedTemplate
    return { seed, filename }
  })

  return cachedSeeds
}

function extractTerms(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

function getSeedText(seed: SeedTemplate): string {
  const systemText = Array.isArray(seed.system)
    ? seed.system.join(' ')
    : seed.system
  return `${seed.name} ${seed.description} ${systemText}`
}

const TASK_TYPE_KEYWORDS: Record<TaskType, string[]> = {
  research: ['research', 'search', 'find', 'investigate', 'synthesize', 'sources'],
  triage: ['triage', 'prioritize', 'categorize', 'route', 'incident', 'alert', 'ticket'],
  monitor: ['monitor', 'watch', 'track', 'scan', 'digest', 'weekly', 'field'],
  extract: ['extract', 'parse', 'structured', 'json', 'schema', 'data'],
  notify: ['notify', 'send', 'message', 'slack', 'alert', 'update', 'post'],
  analyze: ['analyze', 'metrics', 'report', 'dashboard', 'data', 'chart', 'analytics']
}

export async function retrieve(
  prompt: string,
  taskType: TaskType
): Promise<SeedMatch[]> {
  const seeds = loadSeeds()
  const promptTerms = extractTerms(prompt)
  const taskBoostTerms = TASK_TYPE_KEYWORDS[taskType] ?? []

  const scored: SeedMatch[] = seeds.map(({ seed, filename }) => {
    const seedText = getSeedText(seed)
    const seedTerms = extractTerms(seedText)
    const seedTermSet = new Set(seedTerms)

    let score = 0

    // Count keyword overlaps between prompt and seed
    for (const term of promptTerms) {
      if (seedTermSet.has(term)) {
        score += 2
      }
    }

    // Boost for task-type keyword overlap with seed text
    for (const term of taskBoostTerms) {
      if (seedTermSet.has(term)) {
        score += 1
      }
    }

    // Boost for MCP server name mentions
    if (seed.mcp_servers) {
      for (const mcp of seed.mcp_servers) {
        if (prompt.toLowerCase().includes(mcp.name)) {
          score += 3
        }
      }
    }

    return { seed, score, filename }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

/** Reset the cache (useful for testing). */
export function resetSeedCache(): void {
  cachedSeeds = null
}
