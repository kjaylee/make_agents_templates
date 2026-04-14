import { type NextRequest } from 'next/server'
import { forgeStream, type ForgeIntent } from '@forge/engine'
import { handleApiError, ApiError } from '@/lib/apiError'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  // Rate limiting — tier-aware
  const user = await getCurrentUser()
  const tier = user?.tier ?? 'unauth'
  const rateKey = user ? `forge:${user.id}` : `forge:ip:${request.headers.get('x-forwarded-for') ?? 'unknown'}`
  const rateResult = checkRateLimit(rateKey, RATE_LIMITS[tier])

  if (!rateResult.allowed) {
    return Response.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please wait before trying again.',
          retryAfter: rateResult.retryAfter,
        },
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateResult.retryAfter ?? 60) },
      }
    )
  }

  let intent: ForgeIntent

  try {
    const body = await request.json()
    intent = {
      prompt: body.prompt,
      mcpHints: body.mcpHints,
      modelPreference: body.modelPreference,
      apiKey: body.apiKey,
      provider: body.provider,
    }

    if (!intent.prompt || typeof intent.prompt !== 'string') {
      throw new ApiError('BAD_REQUEST', 'prompt is required and must be a string', 400)
    }
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error)
    return handleApiError(new ApiError('BAD_REQUEST', 'Invalid JSON body', 400))
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of forgeStream(intent)) {
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const errorEvent = `data: ${JSON.stringify({ type: 'error', data: message })}\n\n`
        controller.enqueue(encoder.encode(errorEvent))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  })
}
