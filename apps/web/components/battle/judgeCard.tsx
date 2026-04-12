'use client'

import { motion } from 'framer-motion'
import { Trophy, Share } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export interface Verdict {
  winner: 'A' | 'B' | 'tie'
  scoreA: number
  scoreB: number
  notes: string
  agentAName: string
  agentBName: string
}

interface JudgeCardProps {
  verdict: Verdict
  onShare?: () => void
}

export function JudgeCard({ verdict, onShare }: JudgeCardProps) {
  const winnerLabel =
    verdict.winner === 'tie'
      ? 'TIE'
      : verdict.winner === 'A'
        ? verdict.agentAName
        : verdict.agentBName

  return (
    <motion.section
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded border border-bone-200 bg-bone-50 p-6 shadow-ember-lg"
    >
      {/* Gold sweep animation */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 0.9, ease: 'linear' }}
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(232,161,58,0) 40%, rgba(232,161,58,0.28) 50%, rgba(232,161,58,0) 60%, transparent 100%)',
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 text-gold-500">
          <Trophy size={22} weight="duotone" />
          <span className="text-[10px] uppercase tracking-wider">Winner</span>
        </div>
        <h2 className="mt-1 font-display text-3xl tracking-tight text-ink-900">
          {winnerLabel}
        </h2>

        <div className="mt-4 flex items-end gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500">Score</div>
            <div className="mt-1 font-mono text-2xl text-ink-900">
              <span className={verdict.winner === 'A' ? 'text-ember-500' : ''}>
                {verdict.scoreA.toFixed(1)}
              </span>
              <span className="mx-2 text-ink-300">vs</span>
              <span className={verdict.winner === 'B' ? 'text-ember-500' : ''}>
                {verdict.scoreB.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 border-l-2 border-gold-500 pl-3 text-sm italic text-ink-700">
          {verdict.notes}
        </p>

        {onShare && (
          <div className="mt-5">
            <Button variant="secondary" size="sm" onClick={onShare}>
              <Share size={14} weight="duotone" />
              Share this battle
            </Button>
          </div>
        )}
      </div>
    </motion.section>
  )
}
