'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DownloadSimple, Flame, Link } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { EmberReceipt, type ReceiptData } from '@/components/receipt/emberReceipt'

function mockReceipt(id: string): ReceiptData {
  return {
    id,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z',
    agent: { name: 'incident-commander', version: 'v3', slug: 'incident-commander' },
    model: 'Opus 4.6',
    mcpServers: ['sentry', 'linear', 'slack'],
    costUsd: 0.38,
    durationMs: 107_000,
    tokensIn: 12_350,
    tokensOut: 4_210,
    input: 'P0 outage in payment service. Users reporting 500s on checkout since 14:28 UTC.',
    output:
      'Triaged the outage. Root cause: stripe-webhook queue backing up due to a deploy at 14:25 that introduced a sync DB call. Rolled back via linear incident INC-412 and posted to #incidents.',
    trace: [
      { time: '00:00.12', icon: 'tool', description: 'sentry.get_issue', duration: '210ms' },
      { time: '00:00.34', icon: 'tool', description: 'repo.search', duration: '480ms' },
      { time: '00:01.02', icon: 'tool', description: 'linear.create_incident', duration: '720ms' },
      { time: '00:01.47', icon: 'assistant', description: 'assistant reply' },
    ],
    forger: 'alice',
  }
}

export default function ReceiptPage() {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<ReceiptData | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const res = await fetch(`/api/receipt/${params.id}`)
        if (res.ok) {
          const json = (await res.json()) as ReceiptData
          setData(json)
          return
        }
      } catch {
        // fall through to mock
      }
      setData(mockReceipt(params.id))
    }
    fetchReceipt()
  }, [params.id])

  const handleDownload = useCallback(async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const el = document.getElementById('ember-receipt')
      if (!el) return

      const html2canvasMod = await import('html2canvas')
      const html2canvas = html2canvasMod.default
      const canvas = await html2canvas(el, {
        backgroundColor: '#FFFDF8',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `ember-receipt-${params.id}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setDownloading(false)
    }
  }, [downloading, params.id])

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bone-100 bg-paper-grain">
        <Flame size={32} weight="duotone" className="animate-pulse text-ember-500" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bone-100 bg-paper-grain">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <a
          href="/gallery"
          className="mb-8 inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          ← Back to Gallery
        </a>

        <EmberReceipt data={data} />

        {/* MVP uses html2canvas to capture the DOM as a PNG.
            A server-side PDF route can replace this in a future iteration. */}
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
            <DownloadSimple size={16} weight="duotone" />
            {downloading ? 'Rendering…' : 'Download PNG'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const ogUrl = `${window.location.origin}/api/receipt/${params.id}/og`
              navigator.clipboard?.writeText(ogUrl)
            }}
          >
            <Link size={16} weight="duotone" />
            Copy OG image URL
          </Button>
        </div>
      </div>
    </main>
  )
}
