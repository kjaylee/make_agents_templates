import { z } from 'zod'

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
})

function validateEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors
    const message = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
      .join('\n')
    throw new Error(`Environment validation failed:\n${message}`)
  }

  return parsed.data
}

export const env = validateEnv()
