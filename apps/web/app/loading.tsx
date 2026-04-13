export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bone-100">
      {/* Spinner */}
      <div className="mb-6 h-10 w-10 animate-spin rounded-full border-4 border-bone-200 border-t-ember-500" />
      <p className="text-sm text-ink-500">Heating the forge...</p>
    </main>
  )
}
