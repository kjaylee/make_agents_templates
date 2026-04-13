'use client'

import { Hammer, EnvelopeSimple, CheckCircle } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface GalleryAgent {
  slug: string
  name: string
  description: string
  model: string
  mcpServers: string[]
  toolCount: number
  skillCount: number
}

function modelShortName(model: string): string {
  if (model.includes('opus')) return 'Opus'
  if (model.includes('sonnet')) return 'Sonnet'
  if (model.includes('haiku')) return 'Haiku'
  return model
}

export default function LandingPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [seedAgents, setSeedAgents] = useState<GalleryAgent[]>([])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!prompt.trim()) return
      router.push(`/forge?prompt=${encodeURIComponent(prompt.trim())}`)
    },
    [prompt, router]
  )

  // Fetch seed templates for "From the community" section
  useEffect(() => {
    fetch('/api/gallery?limit=10&sort=trending')
      .then((r) => r.json())
      .then((d) => setSeedAgents(d.agents ?? []))
      .catch(() => {})
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="font-display text-xl tracking-tight text-ink-900">
          Forge
        </div>
        <nav className="flex items-center gap-6 text-sm text-ink-500">
          <a className="transition-colors hover:text-ink-900" href="/gallery">
            Gallery
          </a>
          <a className="transition-colors hover:text-ink-900" href="/docs">
            Docs
          </a>
          <a className="transition-colors hover:text-ink-900" href="/pricing">
            Pricing
          </a>
          <button
            type="button"
            onClick={() => router.push('/forge')}
            className="rounded bg-ember-500 px-4 py-2 text-bone-50 shadow-ember transition-transform hover:-translate-y-px hover:bg-ember-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500"
          >
            Start forging
          </button>
        </nav>
      </header>

      {/* Section 1: Hero */}
      <section className="mt-24 text-center">
        <h1 className="font-display text-6xl leading-[1.05] tracking-tight text-ink-900">
          Forge Claude agents
          <br />
          the way you brief a teammate.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-500">
          Describe the job in plain English.
          <br className="hidden sm:block" /> Ship a production agent in under a minute.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-12 flex max-w-xl flex-col gap-4"
        >
          <label htmlFor="intent" className="sr-only">
            What should your agent do?
          </label>
          <textarea
            id="intent"
            name="intent"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What should your agent do?"
            className="w-full resize-none rounded-lg border border-bone-200 bg-bone-50 p-4 font-mono text-sm text-ink-700 shadow-anvil placeholder:text-ink-300 focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-100"
          />
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="mx-auto rounded-lg bg-ember-500 px-6 py-3 text-bone-50 shadow-ember transition-transform hover:-translate-y-px hover:bg-ember-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <span className="inline-flex items-center gap-2">
              <Hammer size={20} weight="duotone" />
              Forge agent
            </span>
          </button>
        </form>

        <div className="mt-10 inline-flex items-center gap-2 rounded border border-bone-200 bg-bone-50 px-3 py-1.5">
          <span className="text-xs uppercase tracking-[0.18em] text-ink-300">
            Powered by Claude Opus 4.6
          </span>
        </div>
      </section>

      {/* Section 2: From the community */}
      <section className="mt-32">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-tight text-ink-900">
            From the community
          </h2>
          <a
            href="/gallery"
            className="text-sm text-ink-500 transition-colors hover:text-ink-900"
          >
            View all →
          </a>
        </div>

        {seedAgents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seedAgents.map((agent) => (
              <article
                key={agent.slug}
                className="group flex flex-col rounded border border-bone-200 bg-bone-50 p-4 shadow-anvil transition-shadow hover:shadow-ember"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center rounded bg-bone-200 px-2 py-0.5 text-xs font-medium text-ink-700">
                    {modelShortName(agent.model)}
                  </span>
                  <span className="text-xs text-ink-300">
                    {agent.toolCount} tools
                  </span>
                </div>
                <h3 className="font-display text-sm font-medium text-ink-900 group-hover:text-ember-500 transition-colors">
                  {agent.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-ink-500">
                  {agent.description}
                </p>
                <div className="mt-3">
                  <a
                    href={`/forge?template=${encodeURIComponent(agent.slug)}`}
                    className="text-xs text-ember-500 hover:underline"
                  >
                    Fork →
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded border border-bone-200 bg-bone-100"
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 3: How Forge works */}
      <section className="mt-32">
        <h2 className="mb-12 text-center font-display text-2xl tracking-tight text-ink-900">
          How Forge works
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Describe',
              body: 'Write a plain-English brief — what your agent should do, what tools it needs, how it should behave.',
            },
            {
              step: '2',
              title: 'Forge',
              body: 'Opus classifies, retrieves similar agents, recommends MCPs, generates, and lints your template in seconds.',
            },
            {
              step: '3',
              title: 'Ship',
              body: 'Copy the YAML or push it straight to Claude Console. Your agent is live in a single click.',
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-ember-500 font-display text-lg font-medium text-bone-50 shadow-ember">
                {step}
              </div>
              <h3 className="font-display text-lg text-ink-900">{title}</h3>
              <p className="mt-2 text-sm text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Pricing */}
      <section className="mt-32" id="pricing">
        <h2 className="mb-12 text-center font-display text-2xl tracking-tight text-ink-900">
          Pricing
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Free */}
          <div className="flex flex-col rounded border border-bone-200 bg-bone-50 p-6 shadow-anvil">
            <div className="mb-4">
              <p className="text-sm font-medium text-ink-500">Free</p>
              <p className="mt-1 font-display text-4xl text-ink-900">$0</p>
              <p className="mt-1 text-xs text-ink-300">forever</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 text-sm text-ink-500">
              <li>10 forges / month</li>
              <li>Public gallery access</li>
              <li>YAML export</li>
            </ul>
            <button
              type="button"
              onClick={() => router.push('/forge')}
              className="mt-6 w-full rounded border border-bone-200 bg-bone-100 py-2 text-sm text-ink-700 transition-colors hover:bg-bone-200"
            >
              Get started
            </button>
          </div>

          {/* Pro — ember accent */}
          <div className="flex flex-col rounded border-2 border-ember-500 bg-bone-50 p-6 shadow-ember-lg">
            <div className="mb-4">
              <p className="text-sm font-medium text-ember-500">Pro</p>
              <p className="mt-1 font-display text-4xl text-ink-900">$19</p>
              <p className="mt-1 text-xs text-ink-300">per month</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 text-sm text-ink-500">
              <li>Unlimited forges</li>
              <li>Private agents</li>
              <li>One-click Console deploy</li>
              <li>Priority support</li>
            </ul>
            <button
              type="button"
              onClick={() => router.push('/forge')}
              className="mt-6 w-full rounded bg-ember-500 py-2 text-sm text-bone-50 shadow-ember transition-transform hover:-translate-y-px hover:bg-ember-600"
            >
              Start Pro
            </button>
          </div>

          {/* Team */}
          <div className="flex flex-col rounded border border-bone-200 bg-bone-50 p-6 shadow-anvil">
            <div className="mb-4">
              <p className="text-sm font-medium text-ink-500">Team</p>
              <p className="mt-1 font-display text-4xl text-ink-900">$99</p>
              <p className="mt-1 text-xs text-ink-300">per month</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 text-sm text-ink-500">
              <li>Everything in Pro</li>
              <li>Up to 10 seats</li>
              <li>Shared agent library</li>
              <li>SSO & audit logs</li>
            </ul>
            <button
              type="button"
              onClick={() => router.push('/forge')}
              className="mt-6 w-full rounded border border-bone-200 bg-bone-100 py-2 text-sm text-ink-700 transition-colors hover:bg-bone-200"
            >
              Contact sales
            </button>
          </div>
        </div>
      </section>

      {/* Section 5: Waitlist */}
      <WaitlistSection />

      {/* Footer */}
      <footer className="mt-32 border-t border-bone-200 bg-bone-200 -mx-6 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-display text-sm text-ink-900">
              Crafted in fire · Deployed in a click
            </span>
            <nav className="flex items-center gap-6 text-sm text-ink-500">
              <a href="/gallery" className="transition-colors hover:text-ink-900">Gallery</a>
              <a href="/docs" className="transition-colors hover:text-ink-900">Docs</a>
              <a href="#pricing" className="transition-colors hover:text-ink-900">Pricing</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ink-900">GitHub</a>
            </nav>
          </div>
          <p className="mt-4 text-xs text-ink-300">
            © {new Date().getFullYear()} Forge. Built with Claude.
          </p>
        </div>
      </footer>
    </main>
  )
}

function WaitlistSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleWaitlist = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = email.trim()
      if (!trimmed) return

      // Store in localStorage for MVP
      const existing: string[] = JSON.parse(
        localStorage.getItem('forge_waitlist') ?? '[]'
      )
      if (!existing.includes(trimmed)) {
        localStorage.setItem(
          'forge_waitlist',
          JSON.stringify([...existing, trimmed])
        )
      }

      setEmail('')
      setSubmitted(true)
    },
    [email]
  )

  return (
    <section className="mt-32 -mx-6 bg-bone-200 px-6 py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl tracking-tight text-ink-900">
          Be first to forge
        </h2>
        <p className="mt-4 text-ink-500">
          Join the waitlist for early access and 3 months free Pro.
        </p>

        {submitted ? (
          <div className="mt-8 inline-flex items-center gap-2 rounded-lg border border-jade-500/30 bg-bone-50 px-6 py-3 text-jade-500">
            <CheckCircle size={20} weight="duotone" />
            <span className="text-sm font-medium">
              You&apos;re on the list!
            </span>
          </div>
        ) : (
          <form
            onSubmit={handleWaitlist}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="waitlist-email" className="sr-only">
              Email address
            </label>
            <div className="relative flex-1">
              <EnvelopeSimple
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
              />
              <input
                id="waitlist-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-bone-200 bg-bone-50 py-3 pl-10 pr-4 text-sm text-ink-700 shadow-anvil placeholder:text-ink-300 focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-100"
              />
            </div>
            <button
              type="submit"
              className="whitespace-nowrap rounded-lg bg-ember-500 px-6 py-3 text-sm font-medium text-bone-50 shadow-ember transition-transform hover:-translate-y-px hover:bg-ember-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500"
            >
              Join waitlist
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
