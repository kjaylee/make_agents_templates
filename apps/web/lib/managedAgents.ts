/**
 * Mock Managed Agents API client.
 * Simulates the Anthropic Managed Agents API for sandbox testing.
 * Replace with real API calls when access is available.
 */

export interface SandboxEvent {
  type: 'tool_call' | 'tool_result' | 'assistant' | 'done' | 'error'
  data: ToolCallData | ToolResultData | AssistantData | DoneData | ErrorData
}

export interface ToolCallData {
  name: string
  input: Record<string, unknown>
  id: string
}

export interface ToolResultData {
  id: string
  output: string
  duration_ms: number
  success: boolean
}

export interface AssistantData {
  text: string
  tokens: number
}

export interface DoneData {
  totalTokensIn: number
  totalTokensOut: number
  costCents: number
  duration_ms: number
}

export interface ErrorData {
  code: string
  message: string
}

let mockIdCounter = 0

export function createMockAgent(_yaml: string): string {
  mockIdCounter += 1
  return `mock-agent-${Date.now()}-${mockIdCounter}`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const MOCK_TOOL_CALLS = [
  {
    name: 'sentry.get_issues',
    input: { project: 'api-gateway', status: 'unresolved', limit: 5 },
    output: '{"issues": [{"id": "SENTRY-4821", "title": "TimeoutError in /api/v2/users", "level": "error", "count": 142}]}',
    duration_ms: 210,
  },
  {
    name: 'github.search_code',
    input: { query: 'TimeoutError handler', repo: 'acme/api-gateway' },
    output: '{"results": [{"path": "src/middleware/timeout.ts", "matches": 3}]}',
    duration_ms: 480,
  },
  {
    name: 'linear.create_issue',
    input: { title: 'Fix TimeoutError in /api/v2/users', priority: 'urgent', team: 'backend' },
    output: '{"id": "ENG-1847", "url": "https://linear.app/acme/issue/ENG-1847"}',
    duration_ms: 720,
  },
]

export async function* runMockSession(
  _agentId: string,
  _input: string
): AsyncGenerator<SandboxEvent> {
  const startTime = Date.now()
  let totalTokensIn = 0
  let totalTokensOut = 0

  // Simulate 2-3 tool calls with realistic delays
  const toolCount = randomBetween(2, 3)
  const toolCalls = MOCK_TOOL_CALLS.slice(0, toolCount)

  for (const tool of toolCalls) {
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Yield tool_call event
    yield {
      type: 'tool_call',
      data: { name: tool.name, input: tool.input, id: callId },
    }

    totalTokensIn += randomBetween(80, 200)
    await delay(randomBetween(300, 800))

    // Yield tool_result event
    yield {
      type: 'tool_result',
      data: {
        id: callId,
        output: tool.output,
        duration_ms: tool.duration_ms + randomBetween(-50, 50),
        success: true,
      },
    }

    totalTokensOut += randomBetween(100, 400)
    await delay(randomBetween(200, 500))
  }

  // Final assistant response
  const assistantTokens = randomBetween(150, 350)
  totalTokensOut += assistantTokens

  yield {
    type: 'assistant',
    data: {
      text: `I've analyzed the Sentry issues and found a critical TimeoutError in the /api/v2/users endpoint (142 occurrences). I've created Linear issue ENG-1847 with urgent priority assigned to the backend team. The root cause appears to be in src/middleware/timeout.ts where the connection pool limit is exceeded under load.`,
      tokens: assistantTokens,
    },
  }

  await delay(100)

  // Cost estimation (Sonnet pricing: $3/$15 per 1M tokens)
  const costCents = (totalTokensIn * 3 + totalTokensOut * 15) / 1_000_000 * 100
  const duration_ms = Date.now() - startTime

  yield {
    type: 'done',
    data: {
      totalTokensIn,
      totalTokensOut,
      costCents: Math.round(costCents * 100) / 100,
      duration_ms,
    },
  }
}
