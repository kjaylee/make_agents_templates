import { chatCompletion, getModelFast } from './llm'

const SYSTEM_PROMPT = `You are an intent extractor. The user will paste a conversation, meeting notes, or a description of a repeated workflow.
Your job: return ONE sentence describing the repeated task that could be automated by an AI agent.

Rules:
- Focus on the repetitive action, not context or people.
- Start with an imperative verb (e.g. "Summarize", "Triage", "Monitor").
- Keep it under 200 characters.
- Respond with ONLY the sentence. No markdown, no explanation, no quotes.`

/**
 * Extract the repeated task description from a conversation.
 * Uses the configured LLM to produce a short imperative summary suitable for the Forge pipeline.
 *
 * Fallback: returns a deterministic heuristic summary based on the first sentence of the input.
 */
export async function classifyConversation(
  text: string
): Promise<string> {
  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text.slice(0, 8000) },
      ],
      { model: getModelFast(), maxTokens: 200, temperature: 0.3 }
    )

    const summary = response.trim().replace(/^["']|["']$/g, '')
    if (summary.length > 0) return summary
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
