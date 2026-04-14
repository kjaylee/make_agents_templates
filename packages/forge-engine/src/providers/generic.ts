import type { TaskType } from '../classifier'
import type { ForgeIntent, LintNote, LLMClient } from '../types'
import type { SeedMatch } from '../retriever'
import type { McpEntry } from '../mcpCatalog'
import type { UniversalAgentConfig, UniversalTool, DataSource } from '../config/universalSchema'
import type {
  LLMProvider,
  QualityTier,
  GenerateProviderResult,
  LintProviderResult
} from './types'

const VALID_TASK_TYPES: ReadonlySet<string> = new Set<TaskType>([
  'research',
  'triage',
  'monitor',
  'extract',
  'notify',
  'analyze'
])

const CLASSIFY_SYSTEM_PROMPT = `You are a task classifier. Given a user's description of an agent they want to build, classify their intent into exactly one of these task types:

- research: The agent gathers, synthesizes, or summarizes information from multiple sources.
- triage: The agent categorizes, prioritizes, or routes incoming items (tickets, alerts, messages).
- monitor: The agent watches a data source over time and reports changes or anomalies.
- extract: The agent pulls structured data from unstructured input (emails, PDFs, logs).
- notify: The agent sends alerts, updates, or messages to people or channels.
- analyze: The agent computes metrics, generates reports, or answers questions from data.

Respond with ONLY a JSON object: { "taskType": "<type>", "confidence": <0.0-1.0> }
No markdown, no explanation.`

const LINT_SYSTEM_PROMPT = `You are an agent template linter. Analyze the given agent configuration and check for anti-patterns. Return ONLY a JSON object with this structure:

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
1. VAGUE_STEPS (error): Instructions have no numbered steps. Agents need clear step-by-step instructions.
2. NO_ESCAPE_HATCH (warn): Instructions don't mention asking the user for clarification when uncertain.
3. TOO_MANY_TOOLS (warn): More than 10 tools attached. This can confuse the agent.
4. NO_CONFIDENCE_THRESHOLD (info): Instructions don't mention any confidence level or threshold for decisions.
5. LONG_INSTRUCTIONS (info): Instructions exceed 2000 characters total. Consider being more concise.
6. MISSING_DESCRIPTION (warn): Agent description is generic or too short (<20 chars).
7. WRONG_MODEL_COMPLEXITY (info): Simple tasks using a high-tier model (overkill) or complex tasks using a low-tier model (underpowered).

No markdown, no explanation — just the JSON.`

function buildGenerateSystemPrompt(seeds: SeedMatch[], mcps: McpEntry[]): string {
  let prompt = `You are Forge, an expert at creating AI Agent configurations.
Given a user's description of what they need an agent to do, generate a complete agent configuration as a JSON object.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "name": "<agent name>",
  "description": "<what the agent does>",
  "system_prompt": "<detailed system prompt with numbered steps and escape hatch>",
  "model": "<suggested model>",
  "mcp_servers": [{"name": "<name>", "url": "<url>"}],
  "tools": [{"type": "agent_toolset_20260401"}, {"type": "mcp_toolset", "mcp_server_name": "<name>", "permission_policy": "always_allow|ask_user"}],
  "skills": [{"type": "anthropic|community", "skill_id": "<id>"}]
}

Guidelines:
- The system_prompt should have numbered steps (1, 2, 3...) that are specific and actionable.
- Always include an escape hatch like: "If the task is unclear or you lack sufficient information, ask the user for clarification before proceeding."
- Only attach MCP servers that are directly relevant to the task.
- Always include {"type": "agent_toolset_20260401"} as the first tool.
- Set permission_policy to "always_allow" for read-only MCPs, "ask_user" for write operations.`

  if (seeds.length > 0) {
    prompt += '\n\nHere are example templates for reference:\n'
    for (const { seed, filename } of seeds) {
      const systemText = Array.isArray(seed.system)
        ? seed.system.join('\n')
        : seed.system
      prompt += `\n--- ${filename} ---\nName: ${seed.name}\nDescription: ${seed.description}\nModel: ${seed.model}\nSystem: ${systemText}\nMCP Servers: ${JSON.stringify(seed.mcp_servers ?? [])}\nTools: ${JSON.stringify(seed.tools)}\nSkills: ${JSON.stringify(seed.skills ?? [])}\n`
    }
  }

  if (mcps.length > 0) {
    prompt += '\n\nAvailable MCP servers you can choose from:\n'
    for (const mcp of mcps) {
      prompt += `- ${mcp.name}: ${mcp.description} (URL: ${mcp.url})\n`
    }
  }

  return prompt
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 128)
}

function parseInstructions(systemPrompt: string): string[] {
  const lines = systemPrompt.split('\n')
  const instructions: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 0) {
      instructions.push(trimmed)
    }
  }
  return instructions.length > 0
    ? instructions
    : ['Follow the user instructions carefully.']
}

/**
 * Extracts JSON from a response that may contain markdown code fences or extra text.
 */
function extractJson(text: string): string {
  // Try to extract from code fence first
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim()
  }
  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }
  return text.trim()
}

export class GenericProvider implements LLMProvider {
  readonly type = 'generic' as const
  private llm: LLMClient

  constructor(llm: LLMClient) {
    this.llm = llm
  }

  getModelForTier(tier: QualityTier): string {
    switch (tier) {
      case 'fast':
        return this.llm.modelFast
      case 'balanced':
        return this.llm.model
      case 'quality':
        return this.llm.model
    }
  }

  getDisplayName(): string {
    return `Generic (${this.llm.model})`
  }

  async classify(prompt: string): Promise<TaskType> {
    try {
      const response = await this.llm.complete(
        [
          { role: 'system', content: CLASSIFY_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        { maxTokens: 64, temperature: 0.3 }
      )

      const jsonStr = extractJson(response)
      const parsed: { taskType: TaskType; confidence: number } = JSON.parse(jsonStr)

      if (!VALID_TASK_TYPES.has(parsed.taskType)) {
        return 'research'
      }

      return parsed.taskType
    } catch {
      // Fallback to keyword matching
      const promptLower = prompt.toLowerCase()
      const keywordMap: Array<{ keywords: string[]; taskType: TaskType }> = [
        { keywords: ['research', 'search', 'find', 'investigate'], taskType: 'research' },
        { keywords: ['triage', 'prioritize', 'categorize', 'route'], taskType: 'triage' },
        { keywords: ['monitor', 'watch', 'track', 'scan'], taskType: 'monitor' },
        { keywords: ['extract', 'parse', 'structured', 'pull'], taskType: 'extract' },
        { keywords: ['notify', 'send', 'alert', 'message'], taskType: 'notify' },
        { keywords: ['analyze', 'report', 'metrics', 'dashboard'], taskType: 'analyze' }
      ]
      for (const { keywords, taskType } of keywordMap) {
        for (const keyword of keywords) {
          if (promptLower.includes(keyword)) {
            return taskType
          }
        }
      }
      return 'research'
    }
  }

  async generate(
    intent: ForgeIntent,
    seeds: SeedMatch[],
    mcps: McpEntry[]
  ): Promise<GenerateProviderResult> {
    const systemPrompt = buildGenerateSystemPrompt(seeds, mcps)

    const userMessage = `Create an agent template for the following request:\n\n${intent.prompt}${intent.mcpHints?.length ? `\n\nHint: the user wants to use these MCP servers: ${intent.mcpHints.join(', ')}` : ''}`

    const response = await this.llm.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      { maxTokens: 4096, temperature: 0.7 }
    )

    const jsonStr = extractJson(response)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      // If JSON parsing fails, build a fallback
      parsed = {}
    }

    const name = (parsed.name as string) ||
      (intent.prompt.length < 60 ? intent.prompt.slice(0, 128) : 'Custom agent')
    const description = (parsed.description as string) || 'A custom agent generated by Forge.'
    const systemPromptText = (parsed.system_prompt as string) || ''
    const model = (parsed.model as string) || this.llm.model

    const dataSources: DataSource[] = []
    const servers = (parsed.mcp_servers as Array<{ name: string; url: string }>) ?? []
    for (const s of servers) {
      dataSources.push({
        type: 'mcp',
        name: s.name,
        url: s.url
      })
    }

    const tools: UniversalTool[] = [{ type: 'agent_toolset_20260401' }]
    const toolEntries = (parsed.tools as Array<Record<string, unknown>>) ?? []
    for (const t of toolEntries) {
      if (t.type === 'agent_toolset_20260401') {
        continue // Already added above
      } else if (t.type === 'mcp_toolset') {
        tools.push({
          type: 'mcp_toolset',
          serverName: (t.mcp_server_name as string) ?? '',
          permissionPolicy: (t.permission_policy as 'always_allow' | 'always_deny' | 'ask_user') ?? 'ask_user'
        })
      }
    }

    const skillEntries = (parsed.skills as Array<{ type: string; skill_id: string }>) ?? []
    for (const s of skillEntries) {
      tools.push({
        type: s.type === 'community' ? 'community_skill' : 'anthropic_skill',
        name: s.skill_id
      })
    }

    const config: UniversalAgentConfig = {
      name,
      description,
      instructions: parseInstructions(systemPromptText),
      model,
      provider: 'generic',
      tools,
      dataSources,
      metadata: { template: slugify(name) }
    }

    // Estimate token counts from string lengths
    const estimatedTokensIn = Math.ceil((systemPrompt.length + userMessage.length) / 4)
    const estimatedTokensOut = Math.ceil(response.length / 4)

    return {
      config,
      tokensIn: estimatedTokensIn,
      tokensOut: estimatedTokensOut
    }
  }

  async lint(config: UniversalAgentConfig): Promise<LintProviderResult> {
    const instructionsText = config.instructions.join('\n')

    // Local checks first
    const localNotes: LintNote[] = []

    if (!/\d+\.\s/.test(instructionsText)) {
      localNotes.push({
        severity: 'error',
        code: 'VAGUE_STEPS',
        message: 'Instructions have no numbered steps. Add step-by-step guidance (1. Do X, 2. Do Y).'
      })
    }

    if (
      !/(?:if\s+unclear|ask\s+the\s+user|clarif|not\s+sure|uncertain)/i.test(
        instructionsText
      )
    ) {
      localNotes.push({
        severity: 'warn',
        code: 'NO_ESCAPE_HATCH',
        message: 'Instructions have no escape hatch. Add "If unclear, ask the user for clarification."'
      })
    }

    if (config.tools.length > 10) {
      localNotes.push({
        severity: 'warn',
        code: 'TOO_MANY_TOOLS',
        message: `${config.tools.length} tools attached. Consider reducing to avoid agent confusion.`
      })
    }

    if (instructionsText.length > 2000) {
      localNotes.push({
        severity: 'info',
        code: 'LONG_INSTRUCTIONS',
        message: `Instructions are ${instructionsText.length} characters. Consider being more concise.`
      })
    }

    if (config.description.length < 20) {
      localNotes.push({
        severity: 'warn',
        code: 'MISSING_DESCRIPTION',
        message: 'Agent description is too short. Add a meaningful description.'
      })
    }

    // Use LLM for deeper analysis
    try {
      const configSummary = JSON.stringify(
        {
          name: config.name,
          description: config.description,
          model: config.model,
          instructions: instructionsText,
          tools_count: config.tools.length,
          dataSources: config.dataSources.map((s) => s.name)
        },
        null,
        2
      )

      const response = await this.llm.complete(
        [
          { role: 'system', content: LINT_SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this agent configuration:\n\n${configSummary}` }
        ],
        { maxTokens: 512, temperature: 0.3 }
      )

      const jsonStr = extractJson(response)
      const aiResult: { score: number; notes: LintNote[] } = JSON.parse(jsonStr)

      const localCodes = new Set(localNotes.map((n) => n.code))
      const mergedNotes = [
        ...localNotes,
        ...(aiResult.notes ?? []).filter((n) => !localCodes.has(n.code))
      ]

      let score = aiResult.score ?? 80
      for (const note of localNotes) {
        if (note.severity === 'error') score -= 15
        else if (note.severity === 'warn') score -= 5
      }
      score = Math.max(0, Math.min(100, score))

      return { score, notes: mergedNotes }
    } catch {
      // Fallback to local checks only
      let score = 100
      for (const note of localNotes) {
        if (note.severity === 'error') score -= 20
        else if (note.severity === 'warn') score -= 10
        else score -= 3
      }

      return { score: Math.max(0, score), notes: localNotes }
    }
  }
}
