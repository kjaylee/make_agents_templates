import type { Template } from '@forge/schema/validators'
import type { ProviderType } from './providers/types'

/**
 * Forge pipeline types.
 * See docs/PLAN.md §4.3 for the full intent → YAML pipeline.
 */

/** Generic LLM integration interface for OpenAI-compatible endpoints. */
export interface LLMClient {
  complete: (
    messages: Array<{ role: string; content: string }>,
    options?: { maxTokens?: number; temperature?: number }
  ) => Promise<string>
  model: string
  modelFast: string
}

export interface ForgeIntent {
  /** Natural-language description of what the agent should do. */
  prompt: string
  /** Optional MCP server name hints from the user. */
  mcpHints?: string[]
  /** Preferred optimization axis: speed / balance / quality. */
  modelPreference?: 'speed' | 'balance' | 'quality'
  /** BYOK: if provided, use the caller's Anthropic key. */
  apiKey?: string
  /** LLM provider to use. Defaults to 'anthropic'. Falls back to 'generic' when llm is provided. */
  provider?: ProviderType
  /** Generic LLM client for OpenAI-compatible endpoints. When provided, overrides provider. */
  llm?: LLMClient
}

export interface LintNote {
  severity: 'info' | 'warn' | 'error'
  code: string
  message: string
  line?: number
}

export interface ForgeResult {
  template: Template
  yaml: string
  lintScore: number // 0-100
  lintNotes: LintNote[]
  tokensIn: number
  tokensOut: number
  costCents: number
  traceId: string
  exportFormats?: {
    claude: string
    openai: string
    langGraph: string
  }
}

/** Stages of the Forge generation pipeline. */
export type ForgeStage =
  | 'classify'
  | 'retrieve'
  | 'recommend_mcps'
  | 'generate'
  | 'lint'
  | 'render'

export interface ForgeProgress {
  stage: ForgeStage
  message: string
  pct: number // 0-100
}
