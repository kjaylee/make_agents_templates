import { checkRateLimit } from '@/lib/rateLimit'
import { handleApiError } from '@/lib/apiError'

export const runtime = 'nodejs'

const RECEIPT_RATE_LIMIT = { windowMs: 60_000, max: 60 }

// Mock ReceiptData matching the shape expected by the receipt page component.
interface TraceStep {
  time: string
  icon: 'tool' | 'assistant'
  description: string
  duration?: string
}

interface ReceiptData {
  id: string
  timestamp: string
  agent: { name: string; version: string; slug: string }
  model: string
  mcpServers: string[]
  costUsd: number
  durationMs: number
  tokensIn: number
  tokensOut: number
  input: string
  output: string
  trace: TraceStep[]
  forger: string
}

function buildMockReceipt(id: string): ReceiptData {
  return {
    id,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z',
    agent: { name: 'incident-commander', version: 'v3', slug: 'incident-commander' },
    model: 'Opus 4.6',
    mcpServers: ['sentry', 'linear', 'slack'],
    costUsd: 0.38,
    durationMs: 107_000,
    tokensIn: 12_350,
    tokensOut: 4_210,
    input: 'P0 outage in payment service. Users reporting 500s on checkout since 14:28 UTC.',
    output:
      'Triaged the outage. Root cause: stripe-webhook queue backing up due to a deploy at 14:25 ' +
      'that introduced a sync DB call. Rolled back via linear incident INC-412 and posted to #incidents.',
    trace: [
      { time: '00:00.12', icon: 'tool', description: 'sentry.get_issue', duration: '210ms' },
      { time: '00:00.34', icon: 'tool', description: 'repo.search', duration: '480ms' },
      { time: '00:01.02', icon: 'tool', description: 'linear.create_incident', duration: '720ms' },
      { time: '00:01.47', icon: 'assistant', description: 'assistant reply' },
    ],
    forger: 'alice',
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Public endpoint — no auth required. Apply a moderate rate limit.
  const rateResult = checkRateLimit(`receipt-data:${(await params).id}`, RECEIPT_RATE_LIMIT)
  if (!rateResult.allowed) {
    return Response.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          retryAfter: rateResult.retryAfter,
        },
      },
      { status: 429, headers: { 'Retry-After': String(rateResult.retryAfter ?? 60) } }
    )
  }

  try {
    const { id } = await params
    const data = buildMockReceipt(id)
    return Response.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
