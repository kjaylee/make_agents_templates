import Anthropic from '@anthropic-ai/sdk'

export type TaskType =
  | 'research'
  | 'triage'
  | 'monitor'
  | 'extract'
  | 'notify'
  | 'analyze'

export interface ClassifyResult {
  taskType: TaskType
  confidence: number
}

const VALID_TASK_TYPES: ReadonlySet<string> = new Set<TaskType>([
  'research',
  'triage',
  'monitor',
  'extract',
  'notify',
  'analyze'
])

const SYSTEM_PROMPT = `You are a task classifier. Given a user's description of an agent they want to build, classify their intent into exactly one of these task types:

- research: The agent gathers, synthesizes, or summarizes information from multiple sources.
- triage: The agent categorizes, prioritizes, or routes incoming items (tickets, alerts, messages).
- monitor: The agent watches a data source over time and reports changes or anomalies.
- extract: The agent pulls structured data from unstructured input (emails, PDFs, logs).
- notify: The agent sends alerts, updates, or messages to people or channels.
- analyze: The agent computes metrics, generates reports, or answers questions from data.

Respond with ONLY a JSON object: { "taskType": "<type>", "confidence": <0.0-1.0> }
No markdown, no explanation.`

export async function classify(
  prompt: string,
  apiKey?: string
): Promise<TaskType> {
  const client = new Anthropic(apiKey ? { apiKey } : undefined)

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 64,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }]
  })

  const text =
    response.content[0]?.type === 'text' ? response.content[0].text : ''

  const parsed: ClassifyResult = JSON.parse(text)

  if (!VALID_TASK_TYPES.has(parsed.taskType)) {
    return 'research'
  }

  return parsed.taskType
}
