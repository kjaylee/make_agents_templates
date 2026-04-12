'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface HammerAnimationProps {
  isActive: boolean
  onComplete?: () => void
}

function SparkParticle({ index }: { index: number }) {
  const angle = (index / 12) * 360
  const rad = (angle * Math.PI) / 180
  const distance = 60 + Math.random() * 40

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-ember-500"
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance,
        opacity: 0,
        scale: 0,
      }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    />
  )
}

export function HammerAnimation({ isActive, onComplete }: HammerAnimationProps) {
  const [showSparks, setShowSparks] = useState(false)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!isActive) {
      setShowSparks(false)
    }
  }, [isActive])

  if (!isActive) return null

  if (prefersReducedMotion) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onAnimationComplete={() => onComplete?.()}
        />
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Hammer SVG */}
        <motion.svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          className="text-ember-500"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.38,
            ease: [0.35, 1.6, 0.64, 1],
          }}
          onAnimationComplete={() => {
            setShowSparks(true)
            setTimeout(() => onComplete?.(), 600)
          }}
        >
          {/* Hammer head */}
          <rect
            x="20"
            y="10"
            width="40"
            height="20"
            rx="3"
            fill="currentColor"
          />
          {/* Handle */}
          <rect
            x="36"
            y="28"
            width="8"
            height="40"
            rx="2"
            fill="#2F2722"
          />
          {/* Strike face */}
          <rect
            x="18"
            y="12"
            width="6"
            height="16"
            rx="1"
            fill="#B63F0E"
          />
        </motion.svg>

        {/* Spark particles */}
        {showSparks && (
          <div className="absolute left-1/2 top-1/2">
            {Array.from({ length: 12 }).map((_, i) => (
              <SparkParticle key={i} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
