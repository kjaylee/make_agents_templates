import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

const WIDTH = 2048
const HEIGHT = 1080

// Anvil palette
const BONE_100 = '#f5f0e6'
const INK_700 = '#2a2520'
const INK_900 = '#15120f'
const EMBER_500 = '#e85d2f'
const GOLD_500 = '#c9a84c'
const IRON_600 = '#6b6460'

interface BattleOgData {
  agentAName: string
  agentBName: string
  scoreA: number
  scoreB: number
  winner: 'A' | 'B' | 'tie'
}

function mockBattleData(_id: string): BattleOgData {
  return {
    agentAName: 'incident-commander',
    agentBName: 'triage-v2',
    scoreA: 8.6,
    scoreB: 7.1,
    winner: 'A',
  }
}

function winnerLabel(data: BattleOgData): string {
  if (data.winner === 'tie') return 'TIE'
  return data.winner === 'A' ? data.agentAName : data.agentBName
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data = mockBattleData(id)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: BONE_100,
          padding: '80px 120px',
          fontFamily: 'system-ui, sans-serif',
          color: INK_700,
        }}
      >
        {/* Title */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontSize: '64px',
            fontWeight: 700,
            color: INK_900,
            letterSpacing: '-1px',
            marginBottom: '64px',
          }}
        >
          Agent Battle
        </div>

        {/* Agent cards side by side */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            gap: '48px',
            marginBottom: '64px',
          }}
        >
          {/* Agent A card */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `4px solid ${data.winner === 'A' ? EMBER_500 : IRON_600}`,
              borderRadius: '16px',
              padding: '48px',
              backgroundColor: data.winner === 'A' ? 'rgba(232,93,47,0.06)' : 'transparent',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '28px',
                color: IRON_600,
                textTransform: 'uppercase',
                letterSpacing: '3px',
                marginBottom: '16px',
              }}
            >
              Agent A
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '56px',
                fontWeight: 700,
                color: data.winner === 'A' ? EMBER_500 : INK_900,
                marginBottom: '24px',
              }}
            >
              {data.agentAName}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '96px',
                fontWeight: 700,
                color: data.winner === 'A' ? EMBER_500 : INK_700,
              }}
            >
              {data.scoreA.toFixed(1)}
            </div>
          </div>

          {/* VS divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '48px',
              fontWeight: 700,
              color: IRON_600,
            }}
          >
            VS
          </div>

          {/* Agent B card */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `4px solid ${data.winner === 'B' ? EMBER_500 : IRON_600}`,
              borderRadius: '16px',
              padding: '48px',
              backgroundColor: data.winner === 'B' ? 'rgba(232,93,47,0.06)' : 'transparent',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '28px',
                color: IRON_600,
                textTransform: 'uppercase',
                letterSpacing: '3px',
                marginBottom: '16px',
              }}
            >
              Agent B
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '56px',
                fontWeight: 700,
                color: data.winner === 'B' ? EMBER_500 : INK_900,
                marginBottom: '24px',
              }}
            >
              {data.agentBName}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '96px',
                fontWeight: 700,
                color: data.winner === 'B' ? EMBER_500 : INK_700,
              }}
            >
              {data.scoreB.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Winner banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: GOLD_500,
            borderRadius: '12px',
            padding: '24px 48px',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '48px',
              fontWeight: 700,
              color: INK_900,
              letterSpacing: '-0.5px',
            }}
          >
            {data.winner === 'tie' ? 'TIE' : `WINNER: ${winnerLabel(data)}`}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '32px',
            fontSize: '28px',
            color: IRON_600,
          }}
        >
          forge.agents.sh · battle/{id.slice(0, 8)}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    }
  )
}
