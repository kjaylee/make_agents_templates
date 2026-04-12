'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface VoiceTranscriptProps {
  text: string
  isTranscribing: boolean
}

/**
 * Live transcript display below the voice orb.
 *
 * ink-500 text, 18px, max 3 lines with overflow hidden.
 * Blinking caret when isTranscribing.
 * Fade-in animation for new text via Framer Motion.
 */
export function VoiceTranscript({ text, isTranscribing }: VoiceTranscriptProps) {
  return (
    <div className="relative min-h-[84px] w-full max-w-sm px-4">
      <AnimatePresence mode="wait">
        {text ? (
          <motion.p
            key="transcript"
            className="line-clamp-3 text-center text-lg leading-7 text-ink-500"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            {text}
            {isTranscribing && (
              <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-[2px] animate-pulse bg-ink-500" />
            )}
          </motion.p>
        ) : isTranscribing ? (
          <motion.p
            key="placeholder"
            className="text-center text-lg text-ink-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Listening
            <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-[2px] animate-pulse bg-ink-300" />
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
