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
const IRON_600 = '#6b6460'

interface ReceiptData {
  id: string
  agentName: string
  model: string
  costCents: number
  durationMs: number
  tokensIn: number
  tokensOut: number
  mcpServers: string[]
  createdAt: string
}

function mockReceiptData(id: string): ReceiptData {
  return {
    id,
    agentName: 'incident-commander',
    model: 'Opus 4.6',
    costCents: 38,
    durationMs: 107_000,
    tokensIn: 12_350,
    tokensOut: 4_210,
    mcpServers: ['sentry', 'linear', 'slack'],
    createdAt: new Date().toISOString(),
  }
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data = mockReceiptData(id)

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
          fontFamily: 'serif',
          color: INK_700,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderBottom: `4px double ${INK_900}`,
            paddingBottom: '32px',
            marginBottom: '48px',
          }}
        >
          <div style={{ fontSize: '96px', fontWeight: 700, color: INK_900, letterSpacing: '-2px' }}>
            Ember Receipt
          </div>
          <div style={{ fontSize: '32px', color: IRON_600, marginTop: '16px' }}>
            {data.createdAt.slice(0, 19).replace('T', ' ')} · run/{data.id.slice(0, 8)}
          </div>
        </div>

        {/* Core stats grid */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            fontSize: '44px',
            marginBottom: '48px',
          }}
        >
          <ReceiptRow label="Agent" value={data.agentName} />
          <ReceiptRow label="Model" value={data.model} />
          <ReceiptRow label="MCP" value={data.mcpServers.join(' · ')} />
          <ReceiptRow label="Cost" value={formatCost(data.costCents)} accent />
          <ReceiptRow label="Duration" value={formatDuration(data.durationMs)} />
          <ReceiptRow
            label="Tokens"
            value={`${data.tokensIn.toLocaleString()} / ${data.tokensOut.toLocaleString()}`}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: `4px double ${INK_900}`,
            margin: '24px 0',
            display: 'flex',
          }}
        />

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 'auto',
            fontSize: '32px',
            color: IRON_600,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: EMBER_500, fontWeight: 700, fontSize: '40px' }}>
              Forged with Forge
            </div>
            <div style={{ marginTop: '8px' }}>forge.agents.sh</div>
          </div>
          <div style={{ display: 'flex' }}>Real run · Anvil</div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    }
  )
}

function ReceiptRow({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'baseline' }}>
      <div
        style={{
          display: 'flex',
          width: '220px',
          color: IRON_600,
          fontSize: '36px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          fontWeight: 700,
          color: accent ? EMBER_500 : INK_900,
          fontSize: accent ? '52px' : '44px',
        }}
      >
        {value}
      </div>
    </div>
  )
}
