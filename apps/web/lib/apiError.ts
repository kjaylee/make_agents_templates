export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 500,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.status }
    )
  }

  const message = error instanceof Error ? error.message : 'Internal server error'

  return Response.json(
    { error: { code: 'INTERNAL_ERROR', message } },
    { status: 500 }
  )
}
