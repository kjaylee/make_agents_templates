'use client'

import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from '@phosphor-icons/react'
import { VoiceOrb } from '@/components/voice/voiceOrb'
import { VoiceTranscript } from '@/components/voice/voiceTranscript'
import { VoiceResults } from '@/components/voice/voiceResults'
import { HammerAnimation } from '@/components/forge/hammerAnimation'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { useForgeStream } from '@/hooks/useForgeStream'

type VoicePhase = 'ready' | 'recording' | 'transcribing' | 'forging' | 'done'

export default function VoiceForingPage() {
  const {
    isRecording,
    transcript,
    amplitude,
    startRecording,
    stopRecording,
    error: micError,
  } = useVoiceRecorder()

  const {
    state: forgeState,
    yaml,
    error: forgeError,
    forge,
  } = useForgeStream()

  const [phase, setPhase] = useState<VoicePhase>('ready')
  const [showHammer, setShowHammer] = useState(false)
  const [fallbackText, setFallbackText] = useState('')

  // Derive display phase from recording + forge states
  const displayPhase: VoicePhase = (() => {
    if (showHammer || forgeState === 'forging') return 'forging'
    if (forgeState === 'streaming') return 'forging'
    if (forgeState === 'done' && yaml) return 'done'
    if (isRecording) return 'recording'
    if (phase === 'transcribing') return 'transcribing'
    return phase
  })()

  const handleStart = useCallback(() => {
    setPhase('recording')
    startRecording()
  }, [startRecording])

  const handleStop = useCallback(() => {
    stopRecording()
    setPhase('transcribing')

    // Watch for transcript to appear, then fire forge
    const checkTranscript = setInterval(() => {
      // We access the transcript via a closure trick: we'll use the
      // useVoiceRecorder's transcript state. But since this is a callback,
      // we need to trigger forge from a useEffect. Instead, we set
      // phase to transcribing and handle the forge trigger separately.
      clearInterval(checkTranscript)
    }, 100)
  }, [stopRecording])

  // Trigger forge when transcript becomes available after recording
  const prevTranscriptRef = useCallback(
    (currentTranscript: string) => {
      if (
        currentTranscript &&
        phase === 'transcribing' &&
        forgeState === 'idle'
      ) {
        setShowHammer(true)
        setPhase('forging')
        setTimeout(() => {
          setShowHammer(false)
          forge({ prompt: currentTranscript })
        }, 1000)
      }
    },
    [phase, forgeState, forge]
  )

  // Check if transcript appeared and trigger forge
  if (transcript && phase === 'transcribing' && forgeState === 'idle') {
    prevTranscriptRef(transcript)
  }

  // Fallback: text input when microphone is denied
  const handleFallbackSubmit = useCallback(() => {
    if (!fallbackText.trim()) return
    setShowHammer(true)
    setPhase('forging')
    setTimeout(() => {
      setShowHammer(false)
      forge({ prompt: fallbackText.trim() })
    }, 1000)
  }, [fallbackText, forge])

  const error = micError || forgeError

  return (
    <main className="flex min-h-[100dvh] flex-col bg-bone-100 bg-paper-grain">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <a
          href="/forge"
          className="font-display text-lg tracking-tight text-ink-900"
        >
          Forge
        </a>
        <a
          href="/forge"
          className="flex h-11 w-11 items-center justify-center rounded text-ink-500 transition-colors hover:text-ink-900"
          aria-label="Close voice forging"
        >
          <X size={24} weight="bold" />
        </a>
      </header>

      {/* Main content — centered vertical stack */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-24">
        {/* Caption */}
        <AnimatePresence mode="wait">
          {displayPhase === 'ready' && (
            <motion.span
              key="hold"
              className="text-xs font-medium uppercase tracking-[0.16em] text-ink-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Hold to speak
            </motion.span>
          )}
          {displayPhase === 'recording' && (
            <motion.span
              key="recording"
              className="text-xs font-medium uppercase tracking-[0.16em] text-ember-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Listening...
            </motion.span>
          )}
          {displayPhase === 'transcribing' && (
            <motion.span
              key="transcribing"
              className="text-xs font-medium uppercase tracking-[0.16em] text-ink-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Processing...
            </motion.span>
          )}
          {displayPhase === 'forging' && (
            <motion.span
              key="forging"
              className="text-xs font-medium uppercase tracking-[0.16em] text-ember-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Forging...
            </motion.span>
          )}
        </AnimatePresence>

        {/* Heading */}
        {displayPhase !== 'done' && (
          <h1 className="max-w-xs text-center font-display text-3xl tracking-tight text-ink-900">
            Describe the job, we&apos;ll forge it.
          </h1>
        )}

        {/* Voice Orb or Results */}
        {displayPhase !== 'done' ? (
          <>
            {/* Mic error fallback: show text input instead of orb */}
            {micError ? (
              <div className="flex w-full max-w-sm flex-col gap-3">
                <p className="text-center text-sm text-rust-500">{micError}</p>
                <textarea
                  rows={4}
                  value={fallbackText}
                  onChange={(e) => setFallbackText(e.target.value)}
                  placeholder="Type your intent instead..."
                  className="w-full resize-none rounded border border-bone-200 bg-bone-50 p-4 font-mono text-sm text-ink-700 placeholder:text-ink-300 focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-100"
                />
                <button
                  type="button"
                  onClick={handleFallbackSubmit}
                  disabled={!fallbackText.trim() || displayPhase === 'forging'}
                  className="rounded bg-ember-500 px-6 py-3 text-[15px] font-medium text-bone-50 shadow-ember transition-all hover:-translate-y-px hover:bg-ember-600 disabled:pointer-events-none disabled:opacity-50"
                >
                  Forge agent
                </button>
              </div>
            ) : (
              <VoiceOrb
                isRecording={isRecording}
                onStart={handleStart}
                onStop={handleStop}
                amplitude={amplitude}
              />
            )}

            {/* Live transcript */}
            <VoiceTranscript
              text={transcript}
              isTranscribing={displayPhase === 'recording' || displayPhase === 'transcribing'}
            />
          </>
        ) : (
          <VoiceResults yaml={yaml} />
        )}

        {/* YAML streaming preview during forging */}
        {displayPhase === 'forging' && yaml && (
          <motion.div
            className="w-full max-w-sm rounded border border-bone-200 bg-bone-50 p-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <pre className="max-h-40 overflow-auto font-mono text-xs leading-5 text-ink-700">
              {yaml}
            </pre>
          </motion.div>
        )}

        {/* Forge error (non-mic) */}
        {forgeError && !micError && (
          <p className="max-w-sm text-center text-sm text-rust-500">
            {forgeError}
          </p>
        )}
      </div>

      {/* Footer */}
      {displayPhase !== 'done' && !micError && (
        <footer className="pb-8 text-center">
          <span className="text-xs text-ink-300">
            Tap to stop &middot; Swipe up to cancel
          </span>
        </footer>
      )}

      {/* Hammer animation overlay */}
      <HammerAnimation
        isActive={showHammer}
        onComplete={() => setShowHammer(false)}
      />
    </main>
  )
}
