import { type NextRequest } from 'next/server'
import { handleApiError, ApiError } from '@/lib/apiError'
import { checkRateLimit } from '@/lib/rateLimit'
import { buildLineage } from '@/lib/lineage'

export const runtime = 'nodejs'

const LINEAGE_RATE_LIMIT = { windowMs: 60_000, max: 60 }

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug || typeof slug !== 'string') {
      throw new ApiError('VALIDATION_ERROR', 'slug is required', 400)
    }

    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    const rateResult = checkRateLimit(`lineage:${ip}`, LINEAGE_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many lineage requests',
            retryAfter: rateResult.retryAfter,
          },
        },
        { status: 429, headers: { 'Retry-After': String(rateResult.retryAfter ?? 60) } }
      )
    }

    const lineage = buildLineage(slug)

    return Response.json(lineage)
  } catch (error) {
    return handleApiError(error)
  }
}
