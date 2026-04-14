import type { TaskType } from '../classifier'
import type { ForgeIntent } from '../types'
import type { LintNote } from '../types'
import type { SeedMatch } from '../retriever'
import type { McpEntry } from '../mcpCatalog'
import type { UniversalAgentConfig } from '../config/universalSchema'

export type ProviderType = 'anthropic' | 'openai' | 'google'
export type QualityTier = 'fast' | 'balanced' | 'quality'

export interface LLMProvider {
  type: ProviderType
  classify(prompt: string): Promise<TaskType>
  generate(
    intent: ForgeIntent,
    seeds: SeedMatch[],
    mcps: McpEntry[]
  ): Promise<GenerateProviderResult>
  lint(config: UniversalAgentConfig): Promise<LintProviderResult>
  getModelForTier(tier: QualityTier): string
  getDisplayName(): string
}

export interface GenerateProviderResult {
  config: UniversalAgentConfig
  tokensIn: number
  tokensOut: number
}

export interface LintProviderResult {
  score: number
  notes: LintNote[]
}
