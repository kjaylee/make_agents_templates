import type { Template } from '@forge/schema/validators'

/**
 * Forge pipeline types.
 * See docs/PLAN.md §4.3 for the full intent → YAML pipeline.
 */

export interface ForgeIntent {
  /** Natural-language description of what the agent should do. */
  prompt: string
  /** Optional MCP server name hints from the user. */
  mcpHints?: string[]
  /** Preferred optimization axis: speed / balance / quality. */
  modelPreference?: 'speed' | 'balance' | 'quality'
  /** BYOK: if provided, use the caller's Anthropic key. */
  apiKey?: string
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
