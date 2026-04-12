import { requireAuth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'
import { createMockAgent, runMockSession } from '@/lib/managedAgents'
import { handleApiError, ApiError } from '@/lib/apiError'
import { generateFuzzCases, type FuzzCase, type FuzzCategory } from '@/lib/fuzzer'

export const runtime = 'nodejs'
export const maxDuration = 300

const FUZZ_RATE_LIMIT = { windowMs: 60_000, max: 5 }

interface FailureRecord {
  caseId: string
  category: FuzzCategory
  input: string
  output: string
}

export async function POST(request: Request) {
  let user
  try {
    user = await requireAuth()
  } catch (res) {
    if (res instanceof Response) return res
    return handleApiError(res)
  }

  const rateResult = checkRateLimit(`fuzz:${user.id}`, FUZZ_RATE_LIMIT)
  if (!rateResult.allowed) {
    return Response.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many fuzz requests',
          retryAfter: rateResult.retryAfter,
        },
      },
      { status: 429, headers: { 'Retry-After': String(rateResult.retryAfter ?? 60) } }
    )
  }

  let agentSlug: string
  try {
    const body = await request.json()
    if (!body.agentSlug || typeof body.agentSlug !== 'string') {
      return handleApiError(new ApiError('VALIDATION_ERROR', 'agentSlug is required', 400))
    }
    agentSlug = body.agentSlug
  } catch {
    return handleApiError(new ApiError('VALIDATION_ERROR', 'Invalid JSON body', 400))
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        const cases = generateFuzzCases(50)
        const total = cases.length
        const agentId = createMockAgent(`mock-yaml-${agentSlug}`)

        const failures: FailureRecord[] = []
        const categoryTotals: Record<FuzzCategory, { pass: number; total: number }> = {
          adversarial: { pass: 0, total: 0 },
          ambiguous: { pass: 0, total: 0 },
          empty: { pass: 0, total: 0 },
          injection: { pass: 0, total: 0 },
        }

        let completed = 0
        let passCount = 0

        for (const fuzzCase of cases) {
          let output = ''
          for await (const event of runMockSession(agentId, fuzzCase.input)) {
            if (event.type === 'assistant') {
              output = (event.data as { text: string }).text
            }
          }

          // Mock verdict: ~80% pass rate, deterministic by case id + slug.
          const verdict: 'pass' | 'fail' = mockVerdict(fuzzCase, agentSlug)

          completed += 1
          categoryTotals[fuzzCase.category].total += 1
          if (verdict === 'pass') {
            passCount += 1
            categoryTotals[fuzzCase.category].pass += 1
          } else {
            failures.push({
              caseId: fuzzCase.id,
              category: fuzzCase.category,
              input: fuzzCase.input,
              output,
            })
          }

          enqueue({
            type: 'case_result',
            data: {
              caseId: fuzzCase.id,
              category: fuzzCase.category,
              verdict,
              output,
            },
          })

          enqueue({
            type: 'progress',
            data: { completed, total },
          })
        }

        const passRateByCategory: Record<FuzzCategory, number> = {
          adversarial: pct(categoryTotals.adversarial),
          ambiguous: pct(categoryTotals.ambiguous),
          empty: pct(categoryTotals.empty),
          injection: pct(categoryTotals.injection),
        }

        const score = Math.round((passCount / total) * 100)

        enqueue({
          type: 'done',
          data: { score, passRateByCategory, failures },
        })
      } catch (err) {
        enqueue({
          type: 'error',
          data: {
            code: 'FUZZ_FAILED',
            message: err instanceof Error ? err.message : 'Unknown fuzz error',
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

function pct(entry: { pass: number; total: number }): number {
  if (entry.total === 0) return 0
  return Math.round((entry.pass / entry.total) * 100)
}

function mockVerdict(fuzzCase: FuzzCase, slug: string): 'pass' | 'fail' {
  // Deterministic pseudo-random with ~80% pass rate.
  const seed = hash(`${slug}:${fuzzCase.id}`)
  return seed % 100 < 80 ? 'pass' : 'fail'
}

function hash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}
