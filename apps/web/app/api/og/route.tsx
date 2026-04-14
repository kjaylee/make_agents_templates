import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const BONE_100 = '#FAF7F1'
const INK_900 = '#1A1613'
const INK_500 = '#6B5E54'
const INK_300 = '#B8A99C'
const EMBER_500 = '#D9541F'
const EMBER_100 = '#FCE8DC'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: BONE_100,
          fontFamily: 'system-ui, sans-serif',
          color: INK_900,
          padding: '80px',
        }}
      >
        {/* Anvil silhouette (text-based) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '120px',
              height: '12px',
              backgroundColor: INK_300,
              borderRadius: '6px',
              marginBottom: '4px',
            }}
          />
          <div
            style={{
              display: 'flex',
              width: '80px',
              height: '40px',
              backgroundColor: INK_300,
              borderRadius: '4px',
              marginBottom: '4px',
            }}
          />
          <div
            style={{
              display: 'flex',
              width: '160px',
              height: '16px',
              backgroundColor: INK_300,
              borderRadius: '8px',
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '96px',
            fontWeight: 700,
            letterSpacing: '-2px',
            color: INK_900,
            marginBottom: '24px',
          }}
        >
          Forge
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: '36px',
            fontWeight: 400,
            color: INK_500,
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
            marginBottom: '48px',
          }}
        >
          Generate, test, and share AI agents in under 60 seconds.
        </div>

        {/* Ember accent bar */}
        <div
          style={{
            display: 'flex',
            width: '120px',
            height: '6px',
            backgroundColor: EMBER_500,
            borderRadius: '3px',
            marginBottom: '48px',
          }}
        />

        {/* CTA pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: EMBER_100,
            borderRadius: '40px',
            padding: '16px 40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              fontWeight: 600,
              color: EMBER_500,
              letterSpacing: '1px',
            }}
          >
            Describe the job. Forge hammers out the agent.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: '40px',
            fontSize: '22px',
            color: INK_300,
          }}
        >
          forge-web-85v.pages.dev
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
