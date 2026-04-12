interface RateLimitConfig {
  windowMs: number
  max: number
}

interface RateLimitResult {
  allowed: boolean
  retryAfter?: number
}

const store = new Map<string, number[]>()

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs

  const timestamps = store.get(key) ?? []
  const valid = timestamps.filter((t) => t > windowStart)

  if (valid.length >= config.max) {
    const oldest = valid[0]!
    const retryAfter = Math.ceil((oldest + config.windowMs - now) / 1000)
    store.set(key, valid)
    return { allowed: false, retryAfter }
  }

  valid.push(now)
  store.set(key, valid)
  return { allowed: true }
}

export const RATE_LIMITS = {
  unauth: { windowMs: 60_000, max: 5 },
  free: { windowMs: 60_000, max: 20 },
  pro: { windowMs: 60_000, max: 60 },
  team: { windowMs: 60_000, max: 60 },
} as const
