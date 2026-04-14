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
import { createProvider, getAvailableProviders } from './providers'
import { exportClaudeYaml } from './config/exporters/claudeYaml'
import { exportOpenAIJson } from './config/exporters/openaiJson'
import { exportLangGraphPython } from './config/exporters/langGraphPy'
import type { UniversalAgentConfig } from './config/universalSchema'

export * from './types'
export type { LLMClient } from './types'
export { classify, type TaskType } from './classifier'
export { retrieve, type SeedMatch } from './retriever'
export { MCP_CATALOG, type McpEntry } from './mcpCatalog'
export { recommendMcps } from './mcpRecommender'
export { generate } from './generator'
export { lint, type LintResult } from './linter'
export { render, renderStream } from './renderer'
export { createProvider, getAvailableProviders } from './providers'
export type {
  LLMProvider,
  ProviderType,
  QualityTier,
  GenerateProviderResult,
  LintProviderResult
} from './providers/types'
export { AnthropicProvider } from './providers/anthropic'
export { OpenAIProvider } from './providers/openai'
export { GoogleProvider } from './providers/google'
export { GenericProvider } from './providers/generic'
export { exportClaudeYaml } from './config/exporters/claudeYaml'
export { exportOpenAIJson } from './config/exporters/openaiJson'
export { exportLangGraphPython } from './config/exporters/langGraphPy'
export type { UniversalAgentConfig, UniversalTool, DataSource } from './config/universalSchema'

// Cost per 1M tokens (approximate cents)
const COST_PER_MILLION_IN: Record<string, number> = {
  'claude-opus-4-6': 1500,
  'claude-sonnet-4-6': 300,
  'claude-haiku-4-5-20251001': 80,
  'gpt-4o': 250,
  'gpt-4o-mini': 15,
  'gemini-2.0-flash': 10,
  'gemini-2.0-pro': 125,
  'gemini-2.0-ultra': 500
}
const COST_PER_MILLION_OUT: Record<string, number> = {
  'claude-opus-4-6': 7500,
  'claude-sonnet-4-6': 1500,
  'claude-haiku-4-5-20251001': 400,
  'gpt-4o': 1000,
  'gpt-4o-mini': 60,
  'gemini-2.0-flash': 40,
  'gemini-2.0-pro': 500,
  'gemini-2.0-ultra': 2000
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

function universalConfigToTemplate(config: UniversalAgentConfig): Template {
  const mcpServers = config.dataSources
    .filter((ds) => ds.type === 'mcp')
    .map((ds) => ({
      name: ds.name,
      type: 'url' as const,
      url: ds.url ?? ''
    }))

  const tools: Template['tools'] = []
  for (const tool of config.tools) {
    if (tool.type === 'agent_toolset_20260401') {
      tools.push({ type: 'agent_toolset_20260401' })
    } else if (tool.type === 'mcp_toolset') {
      tools.push({
        type: 'mcp_toolset',
        mcp_server_name: tool.serverName ?? '',
        default_config: {
          permission_policy: {
            type: tool.permissionPolicy ?? 'ask_user'
          }
        }
      })
    }
  }

  if (!tools.some((t) => t.type === 'agent_toolset_20260401')) {
    tools.unshift({ type: 'agent_toolset_20260401' })
  }

  const skills = config.tools
    .filter((t) => t.type === 'anthropic_skill' || t.type === 'community_skill')
    .map((t) => ({
      type: (t.type === 'community_skill' ? 'community' : 'anthropic') as 'anthropic' | 'community',
      skill_id: t.name ?? ''
    }))

  const slug = config.metadata['template'] ?? config.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 128)

  return {
    name: config.name,
    description: config.description,
    model: config.model as Template['model'],
    system: config.instructions.join('\n'),
    mcp_servers: mcpServers,
    tools,
    skills,
    metadata: { template: slug }
  }
}

/**
 * Generate an agent template from a natural-language intent.
 * Runs the full Forge pipeline: classify → retrieve → recommend → generate → lint → render.
 */
export async function forge(intent: ForgeIntent): Promise<ForgeResult> {
  const traceId = randomUUID()
  const provider = createProvider(intent.provider ?? 'anthropic', intent.apiKey, intent.llm)

  // 1. Classify
  const taskType = await provider.classify(intent.prompt)

  // 2. Retrieve similar seeds
  const seeds = await retrieve(intent.prompt, taskType)

  // 3. Recommend MCPs
  const mcps = recommendMcps(intent.prompt, taskType)

  // 4. Generate template via provider
  const { config, tokensIn, tokensOut } = await provider.generate(
    intent,
    seeds,
    mcps
  )

  // 5. Lint via provider
  const lintResult = await provider.lint(config)

  // 6. Convert to Template and render
  const template = universalConfigToTemplate(config)
  const yaml = render(template)

  // 7. Run all exporters
  const exportFormats = {
    claude: exportClaudeYaml(config),
    openai: exportOpenAIJson(config),
    langGraph: exportLangGraphPython(config)
  }

  // Estimate cost
  const costCents =
    estimateCost(tokensIn, tokensOut, config.model) +
    estimateCost(100, 50, provider.getModelForTier('fast')) * 2

  return {
    template,
    yaml,
    lintScore: lintResult.score,
    lintNotes: lintResult.notes,
    tokensIn,
    tokensOut,
    costCents,
    traceId,
    exportFormats
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
  const provider = createProvider(intent.provider ?? 'anthropic', intent.apiKey, intent.llm)

  try {
    // 1. Classify
    yield {
      type: 'progress',
      data: { stage: 'classify', message: 'Classifying task type...', pct: 0 }
    }
    const taskType = await provider.classify(intent.prompt)
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

    // 4. Generate via provider
    yield {
      type: 'progress',
      data: {
        stage: 'generate',
        message: `Forging template with ${provider.getDisplayName()}...`,
        pct: 45
      }
    }
    const { config, tokensIn, tokensOut } = await provider.generate(
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

    // 5. Lint via provider
    yield {
      type: 'progress',
      data: { stage: 'lint', message: 'Running lint checks...', pct: 75 }
    }
    const lintResult = await provider.lint(config)
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
    const template = universalConfigToTemplate(config)
    for await (const char of renderStream(template)) {
      yield { type: 'yaml', data: char }
    }

    const yaml = render(template)

    // 7. Export formats
    const exportFormats = {
      claude: exportClaudeYaml(config),
      openai: exportOpenAIJson(config),
      langGraph: exportLangGraphPython(config)
    }

    const costCents =
      estimateCost(tokensIn, tokensOut, config.model) +
      estimateCost(100, 50, provider.getModelForTier('fast')) * 2

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
        traceId,
        exportFormats
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    yield { type: 'error', data: message }
  }
}
