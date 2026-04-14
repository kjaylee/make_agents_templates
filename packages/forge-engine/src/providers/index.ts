import type { LLMProvider, ProviderType } from './types'
import type { LLMClient } from '../types'
import { AnthropicProvider } from './anthropic'
import { OpenAIProvider } from './openai'
import { GoogleProvider } from './google'
import { GenericProvider } from './generic'

export function createProvider(
  type: ProviderType = 'anthropic',
  apiKey?: string,
  llmClient?: LLMClient
): LLMProvider {
  // When an LLM client is provided, always use the generic provider
  if (llmClient) {
    return new GenericProvider(llmClient)
  }

  switch (type) {
    case 'anthropic':
      return new AnthropicProvider(apiKey)
    case 'openai':
      return new OpenAIProvider()
    case 'google':
      return new GoogleProvider()
    case 'generic':
      throw new Error('Generic provider requires an llmClient parameter')
    default:
      throw new Error(`Unknown provider type: ${type as string}`)
  }
}

export function getAvailableProviders(): Array<{
  type: ProviderType
  name: string
  models: string[]
}> {
  return [
    {
      type: 'anthropic',
      name: 'Anthropic',
      models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-6']
    },
    {
      type: 'openai',
      name: 'OpenAI',
      models: ['gpt-4o-mini', 'gpt-4o']
    },
    {
      type: 'google',
      name: 'Google',
      models: ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.0-ultra']
    }
  ]
}

export { AnthropicProvider } from './anthropic'
export { OpenAIProvider } from './openai'
export { GoogleProvider } from './google'
export { GenericProvider } from './generic'
export type {
  LLMProvider,
  ProviderType,
  QualityTier,
  GenerateProviderResult,
  LintProviderResult
} from './types'
