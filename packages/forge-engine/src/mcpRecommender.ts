import { MCP_CATALOG, type McpEntry } from './mcpCatalog'
import type { TaskType } from './classifier'

const MAX_RECOMMENDATIONS = 5

export function recommendMcps(prompt: string, taskType: TaskType): McpEntry[] {
  const promptLower = prompt.toLowerCase()
  const promptTerms = promptLower.split(/\s+/)

  const scored = MCP_CATALOG.map((entry) => {
    let score = 0

    // Direct name mention in prompt is a strong signal
    if (promptLower.includes(entry.name)) {
      score += 10
    }

    // Keyword overlap
    for (const keyword of entry.keywords) {
      if (promptLower.includes(keyword)) {
        score += 3
      }
      // Partial word match from prompt terms
      for (const term of promptTerms) {
        if (term.length > 3 && keyword.includes(term)) {
          score += 1
        }
      }
    }

    // Category relevance boost based on task type
    score += getCategoryBoost(taskType, entry.category)

    return { entry, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RECOMMENDATIONS)
    .map((s) => s.entry)
}

function getCategoryBoost(taskType: TaskType, category: string): number {
  const boosts: Record<TaskType, string[]> = {
    research: ['productivity', 'development'],
    triage: ['observability', 'support', 'project-management'],
    monitor: ['observability', 'analytics'],
    extract: ['productivity', 'support'],
    notify: ['communication', 'project-management'],
    analyze: ['analytics', 'observability', 'crm']
  }

  return (boosts[taskType] ?? []).includes(category) ? 2 : 0
}
