import { z } from 'zod'

const envSchema = z.object({
  LLM_BASE_URL: z.string().default('https://api.us-west-2.modal.direct/v1'),
  LLM_API_KEY: z.string().min(1, 'LLM_API_KEY is required'),
  LLM_MODEL: z.string().default('zai-org/GLM-5.1-FP8'),
  LLM_MODEL_FAST: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
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
