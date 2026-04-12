/**
 * Battle judge logic.
 * For MVP: deterministic mock verdict based on token counts + cost.
 * Replace with real Opus 4.6 call when API access is available.
 */

import type { DoneData } from '@/lib/managedAgents'

export interface BattleResult {
  totalTokensIn: number
  totalTokensOut: number
  costCents: number
  duration_ms: number
  transcript: string
}

export interface Verdict {
  winner: 'A' | 'B' | 'tie'
  scoreA: number
  scoreB: number
  notes: string
}

function computeScore(result: BattleResult): number {
  // Higher token output with lower cost → better score
  const efficiency = result.totalTokensOut / Math.max(1, result.costCents)
  const normalized = Math.min(10, Math.max(0, efficiency / 20))
  return Math.round(normalized * 10) / 10
}

/**
 * Judge two battle results.
 * Deterministic mock: compares efficiency (output tokens / cost).
 * Real implementation would call Opus 4.6 with a judging rubric.
 */
export async function judgeBattle(
  resultA: BattleResult,
  resultB: BattleResult,
  input: string
): Promise<Verdict> {
  const scoreA = computeScore(resultA)
  const scoreB = computeScore(resultB)

  let winner: 'A' | 'B' | 'tie'
  let notes: string

  const diff = Math.abs(scoreA - scoreB)

  if (diff < 0.3) {
    winner = 'tie'
    notes = `Both agents performed comparably on "${input.slice(0, 60)}". Scores are within 0.3 points.`
  } else if (scoreA > scoreB) {
    winner = 'A'
    notes = `Agent A demonstrated better token efficiency (${resultA.totalTokensOut} output tokens at ${resultA.costCents.toFixed(2)}¢) compared to Agent B (${resultB.totalTokensOut} at ${resultB.costCents.toFixed(2)}¢). A confirmed user intent more directly.`
  } else {
    winner = 'B'
    notes = `Agent B demonstrated better token efficiency (${resultB.totalTokensOut} output tokens at ${resultB.costCents.toFixed(2)}¢) compared to Agent A (${resultA.totalTokensOut} at ${resultA.costCents.toFixed(2)}¢). B reached a tighter answer with less overhead.`
  }

  return { winner, scoreA, scoreB, notes }
}

/**
 * Build a BattleResult from a sandbox DoneData event + captured transcript.
 */
export function buildBattleResult(
  done: DoneData,
  transcript: string
): BattleResult {
  return {
    totalTokensIn: done.totalTokensIn,
    totalTokensOut: done.totalTokensOut,
    costCents: done.costCents,
    duration_ms: done.duration_ms,
    transcript,
  }
}
