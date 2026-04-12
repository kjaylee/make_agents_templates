'use client'

import { useCallback, useRef, useState } from 'react'

interface UseVoiceRecorderReturn {
  isRecording: boolean
  transcript: string
  amplitude: number
  startRecording: () => void
  stopRecording: () => void
  error: string | null
}

/**
 * Voice recording hook using MediaRecorder + AnalyserNode.
 *
 * MVP: uses mock transcription instead of Whisper API.
 * Real-time amplitude is derived from an AnalyserNode (0-1 range)
 * so the VoiceOrb waveform bars respond to actual mic input.
 */
export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [amplitude, setAmplitude] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const startTimeRef = useRef<number>(0)

  const stopAmplitudeTracking = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }
    setAmplitude(0)
  }, [])

  const trackAmplitude = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const bufferLength = analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)

    const tick = () => {
      analyser.getByteTimeDomainData(dataArray)

      // Compute RMS amplitude normalized to 0-1
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        const sample = dataArray[i] ?? 128
        const normalized = (sample - 128) / 128
        sum += normalized * normalized
      }
      const rms = Math.sqrt(sum / dataArray.length)
      // Scale up for visibility (raw RMS is often quite small)
      const scaled = Math.min(1, rms * 4)
      setAmplitude(scaled)

      animFrameRef.current = requestAnimationFrame(tick)
    }

    tick()
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setTranscript('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up AnalyserNode for real-time amplitude
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Set up MediaRecorder (we don't actually use the recorded data in MVP)
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      startTimeRef.current = Date.now()

      recorder.start()
      setIsRecording(true)
      trackAmplitude()
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access and try again.'
          : err instanceof Error
            ? err.message
            : 'Failed to access microphone'
      setError(message)
    }
  }, [trackAmplitude])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }

    // Stop all tracks on the media stream
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    stopAmplitudeTracking()
    setIsRecording(false)

    // Mock transcription with realistic delay
    // In production, this would send audio to Whisper API
    const duration = ((Date.now() - startTimeRef.current) / 1000).toFixed(1)
    setTimeout(() => {
      setTranscript(
        `I need an agent that monitors deployment health for ${duration}s of context and sends alerts to the engineering Slack channel`
      )
    }, 1500)
  }, [stopAmplitudeTracking])

  return {
    isRecording,
    transcript,
    amplitude,
    startRecording,
    stopRecording,
    error,
  }
}
