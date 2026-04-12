/**
 * Nocturnal Forge — digest email template (§9.8).
 *
 * MVP: logs to console. When RESEND_API_KEY is present in env,
 * the sendDigest() function calls the Resend API instead.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanaryResult {
  agentSlug: string
  passRate: number       // 0–1
  totalRuns: number
  passed: number
  failed: number
  traceUrl: string
}

// ---------------------------------------------------------------------------
// HTML builder
// ---------------------------------------------------------------------------

/**
 * Build an HTML digest email body.
 * Uses inline styles for maximum email-client compatibility.
 */
export function buildDigestHtml(userEmail: string, canaryResults: CanaryResult[]): string {
  const passBar = (rate: number): string => {
    const pct = Math.round(rate * 100)
    const filled = Math.round(pct / 5)   // 20 segments total
    const empty = 20 - filled
    const color = rate >= 0.9 ? '#c9a84c' : rate >= 0.7 ? '#e85d2f' : '#b94040'
    return `
      <table cellpadding="0" cellspacing="0" style="display:inline-table;">
        <tr>
          <td style="background:${color};width:${filled * 10}px;height:12px;border-radius:2px 0 0 2px;"></td>
          <td style="background:#e8e4dc;width:${empty * 10}px;height:12px;border-radius:0 2px 2px 0;"></td>
          <td style="padding-left:10px;font-size:13px;color:#6b6460;vertical-align:middle;">${pct}%</td>
        </tr>
      </table>`
  }

  const agentCards = canaryResults
    .map(
      (r) => `
      <tr>
        <td style="padding:20px 0;border-bottom:1px solid #e8e4dc;">
          <div style="font-size:15px;font-weight:700;color:#15120f;margin-bottom:6px;">${r.agentSlug}</div>
          <div style="margin-bottom:8px;">${passBar(r.passRate)}</div>
          <div style="font-size:12px;color:#6b6460;margin-bottom:12px;">
            ${r.passed} passed &nbsp;&bull;&nbsp; ${r.failed} failed &nbsp;&bull;&nbsp; ${r.totalRuns} total
          </div>
          <a href="${r.traceUrl}"
             style="display:inline-block;font-size:12px;color:#e85d2f;text-decoration:none;border:1px solid #e85d2f;padding:4px 12px;border-radius:4px;">
            Review full trace &rarr;
          </a>
        </td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="color-scheme" content="light dark" />
  <title>Nocturnal Forge Digest</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e6;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#fffdf8;border:1px solid #e8e4dc;border-radius:8px;overflow:hidden;">

          <!-- Hero header -->
          <tr>
            <td style="background:#15120f;padding:32px 40px;">
              <div style="font-size:32px;letter-spacing:-0.5px;color:#fffdf8;font-weight:700;">
                &#127769; Nocturnal Forge
              </div>
              <div style="font-size:13px;color:#6b6460;margin-top:6px;">
                Nightly canary digest for ${userEmail}
              </div>
            </td>
          </tr>

          <!-- Agent cards -->
          <tr>
            <td style="padding:8px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${agentCards.length > 0 ? agentCards : `
                <tr>
                  <td style="padding:32px 0;text-align:center;color:#6b6460;font-size:14px;">
                    No canary subscriptions active.
                  </td>
                </tr>`}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <a href="https://forge.agents.sh/nocturnal"
                 style="display:inline-block;background:#e85d2f;color:#fffdf8;font-size:14px;
                        font-weight:700;text-decoration:none;padding:12px 32px;border-radius:6px;">
                View all canary runs
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e8e4dc;text-align:center;
                       font-size:11px;color:#6b6460;">
              Forge &bull; forge.agents.sh &bull;
              <a href="https://forge.agents.sh/nocturnal/unsubscribe" style="color:#6b6460;">
                unsubscribe
              </a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Send helper
// ---------------------------------------------------------------------------

/**
 * Send a digest email to a single user.
 *
 * MVP: logs the generated HTML to the console.
 * Production: set RESEND_API_KEY to route through Resend.
 */
export async function sendDigest(userEmail: string, canaryResults: CanaryResult[]): Promise<void> {
  const html = buildDigestHtml(userEmail, canaryResults)

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // MVP fallback — log instead of sending.
    console.log(
      `[nocturnal/email] RESEND_API_KEY not set. Would send digest to ${userEmail}.\n`,
      `Pass rate summary: ${canaryResults.map((r) => `${r.agentSlug}=${Math.round(r.passRate * 100)}%`).join(', ')}`
    )
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Forge <nocturnal@forge.agents.sh>',
      to: [userEmail],
      subject: 'Your Nocturnal Forge digest',
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[nocturnal/email] Resend error ${res.status}: ${body}`)
    throw new Error(`Failed to send digest email: ${res.status}`)
  }
}
