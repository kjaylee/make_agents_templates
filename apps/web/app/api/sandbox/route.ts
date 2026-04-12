import { getCurrentUser } from '@/lib/auth'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'
import { createMockAgent, runMockSession } from '@/lib/managedAgents'
import { handleApiError, ApiError } from '@/lib/apiError'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: Request) {
  // Auth check — sandbox requires authentication
  const user = await getCurrentUser()
  if (!user) {
    return handleApiError(new ApiError('UNAUTHORIZED', 'Authentication required to use sandbox', 401))
  }

  // Rate limiting
  const limitConfig = RATE_LIMITS[user.tier] ?? RATE_LIMITS.free
  const rateKey = `sandbox:${user.id}`
  const rateResult = checkRateLimit(rateKey, { windowMs: limitConfig.windowMs, max: limitConfig.max })

  if (!rateResult.allowed) {
    return Response.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many sandbox requests',
          retryAfter: rateResult.retryAfter,
        },
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateResult.retryAfter ?? 60) },
      }
    )
  }

  // Parse request body
  let agentYaml: string
  let input: string

  try {
    const body = await request.json()
    agentYaml = body.agentYaml
    input = body.input

    if (!agentYaml || !input) {
      return handleApiError(new ApiError('VALIDATION_ERROR', 'agentYaml and input are required', 400))
    }
  } catch {
    return handleApiError(new ApiError('VALIDATION_ERROR', 'Invalid JSON body', 400))
  }

  // Create ephemeral agent and stream events
  const agentId = createMockAgent(agentYaml)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runMockSession(agentId, input)) {
          const chunk = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (err) {
        const errorEvent = {
          type: 'error',
          data: {
            code: 'INTERNAL',
            message: err instanceof Error ? err.message : 'Unknown error',
          },
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
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
