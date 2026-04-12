import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are an intent extractor. The user will paste a conversation, meeting notes, or a description of a repeated workflow.
Your job: return ONE sentence describing the repeated task that could be automated by an AI agent.

Rules:
- Focus on the repetitive action, not context or people.
- Start with an imperative verb (e.g. "Summarize", "Triage", "Monitor").
- Keep it under 200 characters.
- Respond with ONLY the sentence. No markdown, no explanation, no quotes.`

/**
 * Extract the repeated task description from a conversation.
 * Uses Haiku 4.5 to produce a short imperative summary suitable for the Forge pipeline.
 *
 * MVP fallback: if no API key is configured, returns a deterministic heuristic summary
 * based on the first sentence of the input.
 */
export async function classifyConversation(
  text: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey ?? process.env.ANTHROPIC_API_KEY

  if (!key) {
    return heuristicSummary(text)
  }

  try {
    const client = new Anthropic({ apiKey: key })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text.slice(0, 8000) }],
    })

    const block = response.content[0]
    if (block && block.type === 'text') {
      const summary = block.text.trim().replace(/^["']|["']$/g, '')
      if (summary.length > 0) return summary
    }
  } catch {
    // Fall through to heuristic
  }

  return heuristicSummary(text)
}

function heuristicSummary(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  if (trimmed.length === 0) return 'Automate a repeated workflow'
  const firstSentence = trimmed.split(/[.!?]/)[0] ?? trimmed
  const clipped = firstSentence.slice(0, 180)
  return `Automate: ${clipped}`
}
