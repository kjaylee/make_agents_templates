import Anthropic from '@anthropic-ai/sdk'
import type { Template } from '@forge/schema/validators'
import type { LintNote } from './types'

export interface LintResult {
  score: number
  notes: LintNote[]
}

const SYSTEM_PROMPT = `You are a Claude Agent template linter. Analyze the given agent template YAML and check for anti-patterns. Return ONLY a JSON object with this structure:

{
  "score": <number 0-100, where 100 is perfect>,
  "notes": [
    {
      "severity": "info" | "warn" | "error",
      "code": "<short-code>",
      "message": "<description>"
    }
  ]
}

Check for these issues:
1. VAGUE_STEPS (error): System prompt has no numbered instructions (1, 2, 3...). Agents need clear step-by-step instructions.
2. NO_ESCAPE_HATCH (warn): System prompt doesn't mention asking the user for clarification when uncertain. Look for phrases like "if unclear", "ask the user", "clarify", "not sure".
3. TOO_MANY_TOOLS (warn): More than 10 tools attached. This can confuse the agent.
4. NO_CONFIDENCE_THRESHOLD (info): System prompt doesn't mention any confidence level or threshold for decisions.
5. LONG_SYSTEM_PROMPT (info): System prompt exceeds 2000 characters. Consider being more concise.
6. MISSING_DESCRIPTION (warn): Agent description is generic or too short (<20 chars).
7. WRONG_MODEL_COMPLEXITY (info): Simple tasks using opus (overkill) or complex tasks using haiku (underpowered).

No markdown, no explanation — just the JSON.`

export async function lint(
  template: Template,
  apiKey?: string
): Promise<LintResult> {
  const systemText = Array.isArray(template.system)
    ? template.system.join('\n')
    : template.system

  // Quick local checks first
  const localNotes: LintNote[] = []

  if (!/\d+\.\s/.test(systemText)) {
    localNotes.push({
      severity: 'error',
      code: 'VAGUE_STEPS',
      message:
        'System prompt has no numbered instructions. Add step-by-step guidance (1. Do X, 2. Do Y).'
    })
  }

  if (
    !/(?:if\s+unclear|ask\s+the\s+user|clarif|not\s+sure|uncertain)/i.test(
      systemText
    )
  ) {
    localNotes.push({
      severity: 'warn',
      code: 'NO_ESCAPE_HATCH',
      message:
        'System prompt has no escape hatch. Add "If unclear, ask the user for clarification."'
    })
  }

  if (template.tools.length > 10) {
    localNotes.push({
      severity: 'warn',
      code: 'TOO_MANY_TOOLS',
      message: `${template.tools.length} tools attached. Consider reducing to avoid agent confusion.`
    })
  }

  if (systemText.length > 2000) {
    localNotes.push({
      severity: 'info',
      code: 'LONG_SYSTEM_PROMPT',
      message: `System prompt is ${systemText.length} characters. Consider being more concise.`
    })
  }

  if (template.description.length < 20) {
    localNotes.push({
      severity: 'warn',
      code: 'MISSING_DESCRIPTION',
      message: 'Agent description is too short. Add a meaningful description.'
    })
  }

  // Use Haiku for deeper analysis
  try {
    const client = new Anthropic(apiKey ? { apiKey } : undefined)

    const templateSummary = JSON.stringify(
      {
        name: template.name,
        description: template.description,
        model: template.model,
        system: systemText,
        tools_count: template.tools.length,
        mcp_servers: template.mcp_servers?.map((s) => s.name) ?? [],
        skills: template.skills?.map((s) => s.skill_id) ?? []
      },
      null,
      2
    )

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this agent template:\n\n${templateSummary}`
        }
      ]
    })

    const text =
      response.content[0]?.type === 'text' ? response.content[0].text : ''

    const aiResult: LintResult = JSON.parse(text)

    // Merge AI notes with local notes, avoiding duplicates
    const localCodes = new Set(localNotes.map((n) => n.code))
    const mergedNotes = [
      ...localNotes,
      ...(aiResult.notes ?? []).filter((n) => !localCodes.has(n.code))
    ]

    // Use AI score but adjust based on local findings
    let score = aiResult.score ?? 80
    for (const note of localNotes) {
      if (note.severity === 'error') score -= 15
      else if (note.severity === 'warn') score -= 5
    }
    score = Math.max(0, Math.min(100, score))

    return { score, notes: mergedNotes }
  } catch {
    // Fallback: compute score from local checks only
    let score = 100
    for (const note of localNotes) {
      if (note.severity === 'error') score -= 20
      else if (note.severity === 'warn') score -= 10
      else score -= 3
    }

    return { score: Math.max(0, score), notes: localNotes }
  }
}
