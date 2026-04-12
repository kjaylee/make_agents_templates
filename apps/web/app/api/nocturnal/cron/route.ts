import { handleApiError, ApiError } from '@/lib/apiError'

export const runtime = 'nodejs'

/**
 * Vercel Cron endpoint for Nocturnal Forge.
 * Runs daily at 02:00 UTC (configured in vercel.json).
 *
 * MVP: just logs "Running canary checks" and returns a stub result.
 * Production flow:
 *   1. Read enabled canary_subscriptions rows
 *   2. For each: run sampleInputs in sandbox
 *   3. Store canary_runs
 *   4. Trigger digest email at user's local 06:30 via Resend
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expected = process.env.CRON_SECRET

    if (!expected) {
      throw new ApiError('CONFIG_ERROR', 'CRON_SECRET not configured', 500)
    }

    if (authHeader !== `Bearer ${expected}`) {
      throw new ApiError('UNAUTHORIZED', 'Invalid cron secret', 401)
    }

    // eslint-disable-next-line no-console
    console.log('[nocturnal] Running canary checks')

    return Response.json({
      ok: true,
      checked: 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
