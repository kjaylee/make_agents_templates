import { type NextRequest } from 'next/server'
import { Webhook } from 'svix'
import { handleApiError, ApiError } from '@/lib/apiError'

export const runtime = 'nodejs'

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ email_address: string }>
    first_name?: string | null
    last_name?: string | null
  }
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.CLERK_WEBHOOK_SECRET
    if (!secret) {
      throw new ApiError('INTERNAL_ERROR', 'Webhook secret not configured', 500)
    }

    // Read raw body for signature verification
    const rawBody = await request.text()

    // Extract svix headers
    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new ApiError('BAD_REQUEST', 'Missing svix signature headers', 400)
    }

    // Verify signature
    const wh = new Webhook(secret)
    let payload: ClerkWebhookEvent
    try {
      payload = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent
    } catch {
      throw new ApiError('UNAUTHORIZED', 'Invalid webhook signature', 401)
    }

    if (!payload.type || !payload.data) {
      throw new ApiError('BAD_REQUEST', 'Invalid webhook payload', 400)
    }

    switch (payload.type) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name } = payload.data
        const email = email_addresses?.[0]?.email_address ?? 'unknown'
        console.log(
          `[Clerk Webhook] user.created: id=${id} email=${email} name=${first_name ?? ''} ${last_name ?? ''}`
        )
        // Future: upsert into users table when DATABASE_URL is configured
        break
      }
      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${payload.type}`)
    }

    return Response.json({ received: true })
  } catch (error) {
    return handleApiError(error)
  }
}
