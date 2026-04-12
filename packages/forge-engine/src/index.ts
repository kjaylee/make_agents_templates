import { randomUUID } from 'node:crypto'
import type { Template } from '@forge/schema/validators'
import type {
  ForgeIntent,
  ForgeResult,
  ForgeProgress,
  LintNote
} from './types'
import { classify, type TaskType } from './classifier'
import { retrieve, type SeedMatch } from './retriever'
import { recommendMcps } from './mcpRecommender'
import type { McpEntry } from './mcpCatalog'
import { generate } from './generator'
import { lint, type LintResult } from './linter'
import { render, renderStream } from './renderer'

export * from './types'
export { classify, type TaskType } from './classifier'
export { retrieve, type SeedMatch } from './retriever'
export { MCP_CATALOG, type McpEntry } from './mcpCatalog'
export { recommendMcps } from './mcpRecommender'
export { generate } from './generator'
export { lint, type LintResult } from './linter'
export { render, renderStream } from './renderer'

// Cost per 1M tokens (approximate cents)
const COST_PER_MILLION_IN: Record<string, number> = {
  'claude-opus-4-6': 1500,
  'claude-sonnet-4-6': 300,
  'claude-haiku-4-5-20251001': 80
}
const COST_PER_MILLION_OUT: Record<string, number> = {
  'claude-opus-4-6': 7500,
  'claude-sonnet-4-6': 1500,
  'claude-haiku-4-5-20251001': 400
}

function estimateCost(
  tokensIn: number,
  tokensOut: number,
  model: string
): number {
  const costIn = ((tokensIn / 1_000_000) * (COST_PER_MILLION_IN[model] ?? 300))
  const costOut =
    (tokensOut / 1_000_000) * (COST_PER_MILLION_OUT[model] ?? 1500)
  return Math.round((costIn + costOut) * 100) / 100
}

/**
 * Generate an agent template from a natural-language intent.
 * Runs the full Forge pipeline: classify → retrieve → recommend → generate → lint → render.
 */
export async function forge(intent: ForgeIntent): Promise<ForgeResult> {
  const traceId = randomUUID()

  // 1. Classify
  const taskType = await classify(intent.prompt, intent.apiKey)

  // 2. Retrieve similar seeds
  const seeds = await retrieve(intent.prompt, taskType)

  // 3. Recommend MCPs
  const mcps = recommendMcps(intent.prompt, taskType)

  // 4. Generate template
  const { template, tokensIn, tokensOut } = await generate(
    intent,
    seeds,
    mcps
  )

  // 5. Lint
  const lintResult = await lint(template, intent.apiKey)

  // 6. Render
  const yaml = render(template)

  // Estimate cost (generator uses opus, classifier + linter use haiku)
  const costCents =
    estimateCost(tokensIn, tokensOut, 'claude-opus-4-6') +
    estimateCost(100, 50, 'claude-haiku-4-5-20251001') * 2

  return {
    template,
    yaml,
    lintScore: lintResult.score,
    lintNotes: lintResult.notes,
    tokensIn,
    tokensOut,
    costCents,
    traceId
  }
}

/**
 * Events emitted by the streaming Forge pipeline.
 */
export type ForgeEvent =
  | { type: 'progress'; data: ForgeProgress }
  | { type: 'yaml'; data: string }
  | { type: 'lint'; data: LintResult }
  | { type: 'done'; data: ForgeResult }
  | { type: 'error'; data: string }

/**
 * Streaming version of the Forge pipeline.
 * Yields ForgeEvents as each stage completes, then streams YAML character by character.
 */
export async function* forgeStream(
  intent: ForgeIntent
): AsyncGenerator<ForgeEvent> {
  const traceId = randomUUID()

  try {
    // 1. Classify
    yield {
      type: 'progress',
      data: { stage: 'classify', message: 'Classifying task type...', pct: 0 }
    }
    const taskType = await classify(intent.prompt, intent.apiKey)
    yield {
      type: 'progress',
      data: {
        stage: 'classify',
        message: `Classified as: ${taskType}`,
        pct: 15
      }
    }

    // 2. Retrieve
    yield {
      type: 'progress',
      data: {
        stage: 'retrieve',
        message: 'Finding similar templates...',
        pct: 20
      }
    }
    const seeds = await retrieve(intent.prompt, taskType)
    yield {
      type: 'progress',
      data: {
        stage: 'retrieve',
        message: `Found ${seeds.length} similar templates`,
        pct: 30
      }
    }

    // 3. Recommend MCPs
    yield {
      type: 'progress',
      data: {
        stage: 'recommend_mcps',
        message: 'Matching MCP servers...',
        pct: 35
      }
    }
    const mcps = recommendMcps(intent.prompt, taskType)
    yield {
      type: 'progress',
      data: {
        stage: 'recommend_mcps',
        message: `Matched ${mcps.length} MCP servers`,
        pct: 40
      }
    }

    // 4. Generate
    yield {
      type: 'progress',
      data: {
        stage: 'generate',
        message: 'Forging template with Opus...',
        pct: 45
      }
    }
    const { template, tokensIn, tokensOut } = await generate(
      intent,
      seeds,
      mcps
    )
    yield {
      type: 'progress',
      data: {
        stage: 'generate',
        message: 'Template generated',
        pct: 70
      }
    }

    // 5. Lint
    yield {
      type: 'progress',
      data: { stage: 'lint', message: 'Running lint checks...', pct: 75 }
    }
    const lintResult = await lint(template, intent.apiKey)
    yield { type: 'lint', data: lintResult }
    yield {
      type: 'progress',
      data: {
        stage: 'lint',
        message: `Lint score: ${lintResult.score}/100`,
        pct: 85
      }
    }

    // 6. Render (streaming)
    yield {
      type: 'progress',
      data: { stage: 'render', message: 'Rendering YAML...', pct: 90 }
    }
    for await (const char of renderStream(template)) {
      yield { type: 'yaml', data: char }
    }

    const yaml = render(template)
    const costCents =
      estimateCost(tokensIn, tokensOut, 'claude-opus-4-6') +
      estimateCost(100, 50, 'claude-haiku-4-5-20251001') * 2

    yield {
      type: 'progress',
      data: { stage: 'render', message: 'Complete', pct: 100 }
    }

    yield {
      type: 'done',
      data: {
        template,
        yaml,
        lintScore: lintResult.score,
        lintNotes: lintResult.notes,
        tokensIn,
        tokensOut,
        costCents,
        traceId
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    yield { type: 'error', data: message }
  }
}
