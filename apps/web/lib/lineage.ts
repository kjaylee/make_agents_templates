/**
 * Mock agent lineage builder.
 * For MVP: synthesizes a deterministic fork tree from a slug.
 * Replace with real DB query against the forks table when available.
 */

export interface LineageNode {
  id: string
  label: string
  version: string
  author: string
  isRoot: boolean
  isCurrent: boolean
  forkedFrom?: string
  diffSummary?: string
}

export interface LineageEdge {
  id: string
  source: string
  target: string
}

export interface LineageData {
  nodes: LineageNode[]
  edges: LineageEdge[]
  currentId: string
}

function hash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const MOCK_AUTHORS = ['alice', 'bob', 'carol', 'dan', 'erin']

/**
 * Build a mock lineage tree for the given agent slug.
 * Always produces a root + 2-4 children with deterministic structure.
 */
export function buildLineage(slug: string): LineageData {
  const seed = hash(slug)
  const childCount = 2 + (seed % 3) // 2-4 children
  const currentBranchIndex = seed % childCount

  const rootId = `${slug}-v1`
  const nodes: LineageNode[] = [
    {
      id: rootId,
      label: slug,
      version: 'v1',
      author: 'forge',
      isRoot: true,
      isCurrent: false,
    },
  ]
  const edges: LineageEdge[] = []

  let currentId = rootId

  for (let i = 0; i < childCount; i += 1) {
    const version = `v${i + 2}`
    const author = MOCK_AUTHORS[(seed + i) % MOCK_AUTHORS.length] ?? 'forge'
    const id = `${slug}-${version}`
    const isCurrent = i === currentBranchIndex

    nodes.push({
      id,
      label: `${slug} ${version}`,
      version,
      author,
      isRoot: false,
      isCurrent,
      forkedFrom: rootId,
      diffSummary: diffSummaryFor(i),
    })
    edges.push({ id: `${rootId}->${id}`, source: rootId, target: id })

    if (isCurrent) {
      currentId = id
    }

    // Give the current branch a grandchild for visual depth.
    if (isCurrent && childCount > 1) {
      const grandId = `${slug}-${version}.1`
      nodes.push({
        id: grandId,
        label: `${slug} ${version}.1`,
        version: `${version}.1`,
        author,
        isRoot: false,
        isCurrent: false,
        forkedFrom: id,
        diffSummary: 'Prompt polish, tool order tweaks',
      })
      edges.push({ id: `${id}->${grandId}`, source: id, target: grandId })
    }
  }

  return { nodes, edges, currentId }
}

function diffSummaryFor(index: number): string {
  const summaries = [
    'Added Slack MCP, refined system prompt',
    'Swapped Sonnet → Opus, new escape hatch',
    'Added Linear + GitHub tools',
    'Tightened tone, added step-by-step instructions',
  ]
  return summaries[index % summaries.length] ?? 'Iterative refinement'
}
