import { requireAuth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'
import { handleApiError, ApiError } from '@/lib/apiError'

export const runtime = 'nodejs'

const NOCTURNAL_RATE_LIMIT = { windowMs: 60_000, max: 10 }

interface SubscribeBody {
  agentSlug?: string
  sampleInputs?: string[]
}

/**
 * MVP: in-memory subscription store.
 * Production will write to canary_subscriptions table via drizzle.
 */
const subscriptions = new Map<
  string,
  { agentSlug: string; sampleInputs: string[]; createdAt: string }
>()

export async function POST(request: Request) {
  let user
  try {
    user = await requireAuth()
  } catch (res) {
    if (res instanceof Response) return res
    return handleApiError(res)
  }

  const rateResult = checkRateLimit(`nocturnal:${user.id}`, NOCTURNAL_RATE_LIMIT)
  if (!rateResult.allowed) {
    return Response.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many subscription requests',
          retryAfter: rateResult.retryAfter,
        },
      },
      { status: 429, headers: { 'Retry-After': String(rateResult.retryAfter ?? 60) } }
    )
  }

  let body: SubscribeBody
  try {
    body = (await request.json()) as SubscribeBody
  } catch {
    return handleApiError(new ApiError('VALIDATION_ERROR', 'Invalid JSON body', 400))
  }

  if (!body.agentSlug || typeof body.agentSlug !== 'string') {
    return handleApiError(new ApiError('VALIDATION_ERROR', 'agentSlug is required', 400))
  }

  if (!Array.isArray(body.sampleInputs) || body.sampleInputs.length === 0) {
    return handleApiError(
      new ApiError('VALIDATION_ERROR', 'sampleInputs must be a non-empty array', 400)
    )
  }

  const key = `${user.id}:${body.agentSlug}`
  const createdAt = new Date().toISOString()

  subscriptions.set(key, {
    agentSlug: body.agentSlug,
    sampleInputs: body.sampleInputs,
    createdAt,
  })

  // eslint-disable-next-line no-console
  console.log(
    `[nocturnal] subscribe user=${user.id} agent=${body.agentSlug} inputs=${body.sampleInputs.length}`
  )

  return Response.json({
    ok: true,
    subscription: {
      agentSlug: body.agentSlug,
      sampleInputs: body.sampleInputs,
      enabled: true,
      createdAt,
    },
  })
}

/**
 * Internal: read subscriptions (used by cron endpoint for MVP).
 */
export function getAllSubscriptions(): Array<{
  key: string
  agentSlug: string
  sampleInputs: string[]
  createdAt: string
}> {
  return Array.from(subscriptions.entries()).map(([key, value]) => ({
    key,
    ...value,
  }))
}
