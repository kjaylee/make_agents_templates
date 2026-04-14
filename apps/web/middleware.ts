import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  // Pages — public (UI only, no API cost)
  '/',
  '/gallery(.*)',
  '/forge(.*)',
  '/battle(.*)',
  '/run(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  // APIs — only read-only endpoints are public
  '/api/gallery',
  '/api/agents/:slug',
  '/api/lineage/:slug',
  '/api/og',
  '/api/receipt/(.*)',
  // LLM-consuming APIs are PROTECTED (require auth):
  // /api/forge, /api/battle, /api/fuzz, /api/extract, /api/sandbox
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
