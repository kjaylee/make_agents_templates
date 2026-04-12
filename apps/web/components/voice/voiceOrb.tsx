'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface VoiceOrbProps {
  isRecording: boolean
  onStart: () => void
  onStop: () => void
  amplitude?: number
}

/** 5-bar waveform inside the orb, heights driven by amplitude. */
function WaveformBars({ amplitude, isRecording }: { amplitude: number; isRecording: boolean }) {
  // Generate 5 bar heights based on amplitude with slight variation
  const barHeights = [0.5, 0.8, 1.0, 0.7, 0.4].map((weight) => {
    if (!isRecording) return 12
    const base = 12
    const max = 48
    return base + (max - base) * amplitude * weight
  })

  return (
    <div className="flex items-center justify-center gap-[6px]">
      {barHeights.map((height, i) => (
        <motion.div
          key={i}
          className="w-[4px] rounded-full bg-bone-50/80"
          animate={{ height }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

/**
 * Voice Orb — a 120px radius ember circle with paper-grain overlay.
 *
 * Hold to record. Release to stop.
 * When recording: heartbeat pulse animation + waveform bars respond to amplitude.
 * prefers-reduced-motion: static display, no pulse.
 */
export function VoiceOrb({ isRecording, onStart, onStop, amplitude = 0 }: VoiceOrbProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mql.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Heartbeat pulse: scale 1 -> 1.05 -> 1 in 600ms loop
  const pulseVariants = {
    idle: { scale: 1, opacity: 0.85 },
    recording: prefersReducedMotion
      ? { scale: 1, opacity: 1 }
      : {
          scale: [1, 1.05, 1],
          opacity: 1,
          transition: {
            scale: {
              duration: 0.6,
              repeat: Infinity,
              ease: 'easeInOut' as const,
            },
          },
        },
  }

  return (
    <motion.button
      type="button"
      className="relative flex h-[240px] w-[240px] cursor-pointer items-center justify-center rounded-full bg-ember-500 select-none touch-none"
      style={{
        // Paper-grain texture overlay
        backgroundImage: "url('/textures/grain-2pct.svg')",
        backgroundBlendMode: 'overlay',
      }}
      variants={pulseVariants}
      animate={isRecording ? 'recording' : 'idle'}
      whileTap={isRecording ? undefined : { scale: 0.96 }}
      onTouchStart={(e) => {
        e.preventDefault()
        onStart()
      }}
      onTouchEnd={(e) => {
        e.preventDefault()
        onStop()
      }}
      onMouseDown={onStart}
      onMouseUp={onStop}
      onMouseLeave={() => {
        if (isRecording) onStop()
      }}
      aria-label={isRecording ? 'Release to stop recording' : 'Hold to start recording'}
      role="button"
    >
      {/* Waveform bars */}
      <WaveformBars amplitude={amplitude} isRecording={isRecording} />

      {/* Outer ring glow when recording */}
      {isRecording && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ boxShadow: '0 0 0 0 rgba(217, 84, 31, 0.4)' }}
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(217, 84, 31, 0.4)',
              '0 0 0 20px rgba(217, 84, 31, 0)',
            ],
          }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  )
}
