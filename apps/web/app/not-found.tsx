import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bone-100 px-6 text-center">
      {/* Anvil silhouette */}
      <div className="mb-8 flex flex-col items-center gap-1">
        <div className="h-2 w-20 rounded-full bg-ink-300" />
        <div className="h-8 w-14 rounded bg-ink-300" />
        <div className="h-3 w-28 rounded-full bg-ink-300" />
      </div>

      <h1 className="font-display text-4xl tracking-tight text-ink-900 sm:text-5xl">
        Lost in the forge
      </h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-500">
        This page doesn&apos;t exist. Let&apos;s get you back to forging.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-ember-500 px-6 py-3 text-bone-50 shadow-ember transition-transform hover:-translate-y-px hover:bg-ember-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500"
      >
        Back to Forge
      </Link>
    </main>
  )
}
