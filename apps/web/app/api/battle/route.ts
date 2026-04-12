import { requireAuth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'
import { createMockAgent, runMockSession, type SandboxEvent, type DoneData } from '@/lib/managedAgents'
import { handleApiError, ApiError } from '@/lib/apiError'
import { judgeBattle, buildBattleResult, type BattleResult } from '@/lib/battle'

export const runtime = 'nodejs'
export const maxDuration = 120

const BATTLE_RATE_LIMIT = { windowMs: 60_000, max: 10 }

interface BattleRequestBody {
  agentASlug?: string
  agentBSlug?: string
  input?: string
}

export async function POST(request: Request) {
  let user
  try {
    user = await requireAuth()
  } catch (res) {
    if (res instanceof Response) return res
    return handleApiError(res)
  }

  const rateResult = checkRateLimit(`battle:${user.id}`, BATTLE_RATE_LIMIT)
  if (!rateResult.allowed) {
    return Response.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many battle requests',
          retryAfter: rateResult.retryAfter,
        },
      },
      { status: 429, headers: { 'Retry-After': String(rateResult.retryAfter ?? 60) } }
    )
  }

  let agentASlug: string
  let agentBSlug: string
  let input: string

  try {
    const body = (await request.json()) as BattleRequestBody
    if (!body.agentASlug || !body.agentBSlug || !body.input) {
      return handleApiError(
        new ApiError('VALIDATION_ERROR', 'agentASlug, agentBSlug, and input are required', 400)
      )
    }
    agentASlug = body.agentASlug
    agentBSlug = body.agentBSlug
    input = body.input
  } catch {
    return handleApiError(new ApiError('VALIDATION_ERROR', 'Invalid JSON body', 400))
  }

  const encoder = new TextEncoder()
  const agentAId = createMockAgent(`mock-yaml-${agentASlug}`)
  const agentBId = createMockAgent(`mock-yaml-${agentBSlug}`)

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        // Run both agents in parallel, interleaving events as they arrive.
        // Each IIFE returns the accumulated done data + transcript so we
        // avoid TypeScript's closure-narrowing limitations with mutable refs.
        const runAgent = async (
          agentId: string,
          eventType: 'agent_a_event' | 'agent_b_event'
        ): Promise<{ done: DoneData; transcript: string }> => {
          let done: DoneData | null = null
          let transcript = ''
          for await (const event of runMockSession(agentId, input)) {
            enqueue({ type: eventType, data: event })
            if (event.type === 'assistant') {
              transcript += (event.data as { text: string }).text
            }
            if (event.type === 'done') {
              done = event.data as DoneData
            }
          }
          if (!done) throw new Error(`Agent ${eventType} run did not complete`)
          return { done, transcript }
        }

        const [resA, resB] = await Promise.all([
          runAgent(agentAId, 'agent_a_event'),
          runAgent(agentBId, 'agent_b_event'),
        ])

        // Emit per-agent done events so the client side panel can display
        // token counts and cost. These must arrive before the verdict event.
        enqueue({
          type: 'agent_a_done',
          data: {
            tokens: resA.done.totalTokensIn + resA.done.totalTokensOut,
            costUsd: resA.done.costCents / 100,
            durationMs: resA.done.duration_ms,
            output: resA.transcript,
          },
        })
        enqueue({
          type: 'agent_b_done',
          data: {
            tokens: resB.done.totalTokensIn + resB.done.totalTokensOut,
            costUsd: resB.done.costCents / 100,
            durationMs: resB.done.duration_ms,
            output: resB.transcript,
          },
        })

        const resultA: BattleResult = buildBattleResult(resA.done, resA.transcript)
        const resultB: BattleResult = buildBattleResult(resB.done, resB.transcript)
        const verdict = await judgeBattle(resultA, resultB, input)

        enqueue({ type: 'verdict', data: verdict })
        enqueue({ type: 'done' })
      } catch (err) {
        enqueue({
          type: 'error',
          data: {
            code: 'BATTLE_FAILED',
            message: err instanceof Error ? err.message : 'Unknown battle error',
          },
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
