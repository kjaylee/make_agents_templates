import { type NextRequest } from 'next/server'
import { forgeStream, type ForgeIntent } from '@forge/engine'
import { handleApiError, ApiError } from '@/lib/apiError'
import { checkRateLimit } from '@/lib/rateLimit'
import { getCurrentUser } from '@/lib/auth'
import { classifyConversation } from '@/lib/classifyConversation'
import { chatCompletion, getModel, getModelFast } from '@/lib/llm'

export const runtime = 'nodejs'
export const maxDuration = 120

const EXTRACT_RATE_LIMITS = {
  unauth: { windowMs: 60_000, max: 0 },
  free: { windowMs: 60_000, max: 20 },
  pro: { windowMs: 60_000, max: 60 },
  team: { windowMs: 60_000, max: 60 },
} as const

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return handleApiError(new ApiError('UNAUTHORIZED', 'Authentication required for extract', 401))
  }

  const limitConfig = EXTRACT_RATE_LIMITS[user.tier] ?? EXTRACT_RATE_LIMITS.free
  const rateResult = checkRateLimit(`extract:${user.id}`, limitConfig)
  if (!rateResult.allowed) {
    return Response.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many extract requests',
          retryAfter: rateResult.retryAfter,
        },
      },
      { status: 429, headers: { 'Retry-After': String(rateResult.retryAfter ?? 60) } }
    )
  }

  let text: string
  try {
    const body = await request.json()
    if (!body.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
      return handleApiError(new ApiError('VALIDATION_ERROR', 'text is required', 400))
    }
    text = body.text
  } catch {
    return handleApiError(new ApiError('VALIDATION_ERROR', 'Invalid JSON body', 400))
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        // Step 1: classify conversation → task summary via Haiku.
        enqueue({
          type: 'progress',
          data: { stage: 'extract', message: 'Extracting repeated task...', pct: 0 },
        })

        const summary = await classifyConversation(text)

        enqueue({
          type: 'extracted',
          data: { summary },
        })

        enqueue({
          type: 'progress',
          data: { stage: 'extract', message: `Task: ${summary}`, pct: 10 },
        })

        // Step 2: feed the summary into the forge pipeline.
        const llmClient = {
          complete: (
            msgs: Array<{ role: string; content: string }>,
            opts?: { maxTokens?: number; temperature?: number }
          ) =>
            chatCompletion(
              msgs as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
              opts
            ),
          model: getModel(),
          modelFast: getModelFast(),
        }
        const intent: ForgeIntent = { prompt: summary, llm: llmClient }
        for await (const event of forgeStream(intent)) {
          enqueue(event)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        enqueue({ type: 'error', data: message })
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
