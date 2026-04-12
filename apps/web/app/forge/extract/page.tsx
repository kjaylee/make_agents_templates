'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hammer, Flame } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ConversationInput } from '@/components/extract/conversationInput'

export default function ExtractPage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleForge = useCallback(async () => {
    if (!text.trim() || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `HTTP ${res.status}`)
      }

      // Read the SSE stream, collect final YAML, then redirect.
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''
      let yaml = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue
          try {
            const event = JSON.parse(data)
            if (event.type === 'yaml') yaml += event.data
            if (event.type === 'done' && event.data?.yaml) yaml = event.data.yaml
            if (event.type === 'error') throw new Error(event.data ?? 'Extract failed')
          } catch (e) {
            if (e instanceof SyntaxError) continue
            throw e
          }
        }
      }

      const encoded = encodeURIComponent(yaml.slice(0, 4000))
      router.push(`/forge?yaml=${encoded}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extract failed')
      setSubmitting(false)
    }
  }, [text, submitting, router])

  return (
    <main className="min-h-screen bg-bone-100 bg-paper-grain">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <a
          href="/forge"
          className="mb-8 inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          ← Back to Forge
        </a>

        <section className="text-center">
          <div className="inline-flex items-center gap-2 text-ember-500">
            <Flame size={24} weight="duotone" />
            <span className="text-[10px] uppercase tracking-wider">Extract</span>
          </div>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
            Describe an existing routine.
          </h1>
          <p className="mt-3 text-ink-500">
            We&apos;ll turn it into an agent.
          </p>
        </section>

        <section className="mt-10">
          <ConversationInput value={text} onChange={setText} disabled={submitting} />
        </section>

        <section className="mt-6 flex flex-col items-center gap-3">
          <Button size="lg" onClick={handleForge} disabled={!text.trim() || submitting}>
            <Hammer size={18} weight="duotone" />
            {submitting ? 'Forging from this…' : 'Forge from this'}
          </Button>
          {error && <p className="text-sm text-rust-500">{error}</p>}
        </section>
      </div>
    </main>
  )
}
