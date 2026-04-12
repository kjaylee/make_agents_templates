import { currentUser } from '@clerk/nextjs/server'

export interface AuthUser {
  id: string
  email: string
  tier: 'free' | 'pro' | 'team'
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const user = await currentUser()
    if (!user) return null

    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? '',
      tier: (user.publicMetadata?.tier as AuthUser['tier']) ?? 'free',
    }
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Response(
      JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return user
}
