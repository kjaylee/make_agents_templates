import OpenAI from 'openai'
import { env } from './env'

export function createLLMClient(): OpenAI {
  return new OpenAI({
    baseURL: env.LLM_BASE_URL,
    apiKey: env.LLM_API_KEY,
  })
}

export function getModel(): string {
  return env.LLM_MODEL
}

export function getModelFast(): string {
  return env.LLM_MODEL_FAST || env.LLM_MODEL
}

export async function chatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { model?: string; maxTokens?: number; temperature?: number }
): Promise<string> {
  const client = createLLMClient()
  const response = await client.chat.completions.create({
    model: options?.model || getModel(),
    messages,
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature || 0.7,
  })
  return response.choices[0]?.message?.content || ''
}
