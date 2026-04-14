import Anthropic from '@anthropic-ai/sdk'
import type { TaskType } from '../classifier'
import type { ForgeIntent, LintNote } from '../types'
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

const GENERATE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'generate_system_prompt',
    description:
      'Generate a system prompt for the agent. Include numbered step-by-step instructions, an escape hatch (e.g. "If unclear, ask the user"), and tone guidance.',
    input_schema: {
      type: 'object' as const,
      properties: {
        system_prompt: {
          type: 'string',
          description:
            'The full system prompt text with numbered steps and escape hatch.'
        },
        tone: {
          type: 'string',
          description:
            'The tone the agent should use (e.g. professional, friendly, concise).'
        }
      },
      required: ['system_prompt', 'tone']
    }
  },
  {
    name: 'select_model',
    description:
      'Select the best Claude model for this agent based on its task complexity.',
    input_schema: {
      type: 'object' as const,
      properties: {
        model: {
          type: 'string',
          enum: [
            'claude-opus-4-6',
            'claude-sonnet-4-6',
            'claude-haiku-4-5-20251001'
          ],
          description: 'The selected model identifier.'
        },
        rationale: {
          type: 'string',
          description: 'Why this model was chosen.'
        }
      },
      required: ['model', 'rationale']
    }
  },
  {
    name: 'attach_mcps',
    description:
      'Select which MCP servers the agent needs and set their permission policies.',
    input_schema: {
      type: 'object' as const,
      properties: {
        mcp_servers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['url'] },
              url: { type: 'string' }
            },
            required: ['name', 'type', 'url']
          },
          description: 'MCP servers to attach.'
        },
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              mcp_server_name: { type: 'string' },
              default_config: {
                type: 'object',
                properties: {
                  permission_policy: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['always_allow', 'always_deny', 'ask_user']
                      }
                    },
                    required: ['type']
                  }
                },
                required: ['permission_policy']
              }
            },
            required: ['type']
          },
          description:
            'Tool entries including agent_toolset_20260401 and mcp_toolset entries.'
        }
      },
      required: ['mcp_servers', 'tools']
    }
  },
  {
    name: 'attach_skills',
    description:
      'Select Anthropic skills to attach to the agent (e.g. docx, pdf, code-execution).',
    input_schema: {
      type: 'object' as const,
      properties: {
        skills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['anthropic', 'community']
              },
              skill_id: { type: 'string' }
            },
            required: ['type', 'skill_id']
          },
          description: 'Skills to attach.'
        }
      },
      required: ['skills']
    }
  }
]

function buildGenerateSystemPrompt(seeds: SeedMatch[], mcps: McpEntry[]): string {
  let prompt = `You are Forge, an expert at creating Claude Agent configurations.
Given a user's description of what they need an agent to do, you will generate a complete agent template by calling each of the provided tools exactly once.

Guidelines:
- The system prompt should have numbered steps (1, 2, 3...) that are specific and actionable.
- Always include an escape hatch like: "If the task is unclear or you lack sufficient information, ask the user for clarification before proceeding."
- Choose the right model: use claude-haiku-4-5-20251001 for simple/fast tasks, claude-sonnet-4-6 for most tasks, claude-opus-4-6 for complex reasoning.
- Only attach MCP servers that are directly relevant to the task.
- Always include { type: "agent_toolset_20260401" } as the first tool.
- Set permission_policy to "always_allow" for read-only MCPs, "ask_user" for write operations.

You MUST call all 4 tools: generate_system_prompt, select_model, attach_mcps, attach_skills.`

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

export class AnthropicProvider implements LLMProvider {
  readonly type = 'anthropic' as const
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  getModelForTier(tier: QualityTier): string {
    switch (tier) {
      case 'fast':
        return 'claude-haiku-4-5-20251001'
      case 'balanced':
        return 'claude-sonnet-4-6'
      case 'quality':
        return 'claude-opus-4-6'
    }
  }

  getDisplayName(): string {
    return 'Anthropic'
  }

  async classify(prompt: string): Promise<TaskType> {
    const client = new Anthropic(this.apiKey ? { apiKey: this.apiKey } : undefined)

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      system: CLASSIFY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    })

    const text =
      response.content[0]?.type === 'text' ? response.content[0].text : ''

    const parsed: { taskType: TaskType; confidence: number } = JSON.parse(text)

    if (!VALID_TASK_TYPES.has(parsed.taskType)) {
      return 'research'
    }

    return parsed.taskType
  }

  async generate(
    intent: ForgeIntent,
    seeds: SeedMatch[],
    mcps: McpEntry[]
  ): Promise<GenerateProviderResult> {
    const client = new Anthropic(
      intent.apiKey ? { apiKey: intent.apiKey } : this.apiKey ? { apiKey: this.apiKey } : undefined
    )

    const systemPrompt = buildGenerateSystemPrompt(seeds, mcps)
    const result = await this.callWithRetry(client, systemPrompt, intent, mcps, false)
    return result
  }

  private async callWithRetry(
    client: Anthropic,
    systemPrompt: string,
    intent: ForgeIntent,
    mcps: McpEntry[],
    isRetry: boolean
  ): Promise<GenerateProviderResult> {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: GENERATE_TOOLS,
      messages: [
        {
          role: 'user',
          content: `Create an agent template for the following request:\n\n${intent.prompt}${intent.mcpHints?.length ? `\n\nHint: the user wants to use these MCP servers: ${intent.mcpHints.join(', ')}` : ''}`
        }
      ]
    })

    let systemPromptText = ''
    let model = 'claude-sonnet-4-6'
    let name = 'Custom agent'
    const description = 'A custom agent generated by Forge.'
    const dataSources: DataSource[] = []
    const tools: UniversalTool[] = [{ type: 'agent_toolset_20260401' }]

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue

      const input = block.input as Record<string, unknown>

      switch (block.name) {
        case 'generate_system_prompt':
          systemPromptText = (input.system_prompt as string) ?? ''
          break

        case 'select_model':
          model = (input.model as string) ?? 'claude-sonnet-4-6'
          break

        case 'attach_mcps': {
          const servers = (input.mcp_servers as Array<{
            name: string
            type: string
            url: string
          }>) ?? []
          for (const s of servers) {
            dataSources.push({
              type: 'mcp',
              name: s.name,
              url: s.url
            })
          }
          const toolEntries = (input.tools as Array<Record<string, unknown>>) ?? []
          // Clear default and rebuild
          tools.length = 0
          for (const t of toolEntries) {
            if (t.type === 'agent_toolset_20260401') {
              tools.push({ type: 'agent_toolset_20260401' })
            } else {
              const permPolicy = ((t.default_config as Record<string, unknown>)
                ?.permission_policy as Record<string, unknown>)
                ?.type as 'always_allow' | 'always_deny' | 'ask_user' | undefined
              tools.push({
                type: 'mcp_toolset',
                serverName: (t.mcp_server_name as string) ?? '',
                permissionPolicy: permPolicy ?? 'ask_user'
              })
            }
          }
          if (!tools.some((t) => t.type === 'agent_toolset_20260401')) {
            tools.unshift({ type: 'agent_toolset_20260401' })
          }
          break
        }

        case 'attach_skills': {
          const skillEntries = (input.skills as Array<{
            type: string
            skill_id: string
          }>) ?? []
          for (const s of skillEntries) {
            tools.push({
              type: s.type === 'community' ? 'community_skill' : 'anthropic_skill',
              name: s.skill_id
            })
          }
          break
        }
      }
    }

    const promptLower = intent.prompt.toLowerCase()
    if (promptLower.length < 60) {
      name = intent.prompt.slice(0, 128)
    }

    const config: UniversalAgentConfig = {
      name,
      description,
      instructions: parseInstructions(systemPromptText),
      model,
      provider: 'anthropic',
      tools,
      dataSources,
      metadata: { template: slugify(name) }
    }

    // Validate basic quality
    if (config.instructions.length <= 1 && !isRetry) {
      return this.callWithRetry(client, systemPrompt, intent, mcps, true)
    }

    return {
      config,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens
    }
  }

  async lint(config: UniversalAgentConfig): Promise<LintProviderResult> {
    const instructionsText = config.instructions.join('\n')

    const localNotes: LintNote[] = []

    if (!/\d+\.\s/.test(instructionsText)) {
      localNotes.push({
        severity: 'error',
        code: 'VAGUE_STEPS',
        message:
          'Instructions have no numbered steps. Add step-by-step guidance (1. Do X, 2. Do Y).'
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
        message:
          'Instructions have no escape hatch. Add "If unclear, ask the user for clarification."'
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

    try {
      const client = new Anthropic(
        this.apiKey ? { apiKey: this.apiKey } : undefined
      )

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

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: LINT_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analyze this agent configuration:\n\n${configSummary}`
          }
        ]
      })

      const text =
        response.content[0]?.type === 'text' ? response.content[0].text : ''

      const aiResult: { score: number; notes: LintNote[] } = JSON.parse(text)

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
