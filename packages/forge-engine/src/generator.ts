import Anthropic from '@anthropic-ai/sdk'
import { templateSchema, type Template } from '@forge/schema/validators'
import type { ForgeIntent } from './types'
import type { SeedMatch } from './retriever'
import type { McpEntry } from './mcpCatalog'

export interface GenerateResult {
  template: Template
  tokensIn: number
  tokensOut: number
}

const TOOLS: Anthropic.Tool[] = [
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

function buildSystemPrompt(seeds: SeedMatch[], mcps: McpEntry[]): string {
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

export async function generate(
  intent: ForgeIntent,
  seeds: SeedMatch[],
  mcps: McpEntry[]
): Promise<GenerateResult> {
  const client = new Anthropic(intent.apiKey ? { apiKey: intent.apiKey } : undefined)

  const systemPrompt = buildSystemPrompt(seeds, mcps)

  const result = await callWithRetry(client, systemPrompt, intent, mcps)
  return result
}

async function callWithRetry(
  client: Anthropic,
  systemPrompt: string,
  intent: ForgeIntent,
  mcps: McpEntry[],
  isRetry = false
): Promise<GenerateResult> {
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    tools: TOOLS,
    messages: [
      {
        role: 'user',
        content: `Create an agent template for the following request:\n\n${intent.prompt}${intent.mcpHints?.length ? `\n\nHint: the user wants to use these MCP servers: ${intent.mcpHints.join(', ')}` : ''}`
      }
    ]
  })

  // Extract tool use results
  let systemPromptText = ''
  let model: Template['model'] = 'claude-sonnet-4-6'
  let name = 'Custom agent'
  let description = 'A custom agent generated by Forge.'
  let mcpServers: Template['mcp_servers'] = []
  let tools: Template['tools'] = [{ type: 'agent_toolset_20260401' }]
  let skills: Template['skills'] = []

  for (const block of response.content) {
    if (block.type !== 'tool_use') continue

    const input = block.input as Record<string, unknown>

    switch (block.name) {
      case 'generate_system_prompt':
        systemPromptText = (input.system_prompt as string) ?? ''
        break

      case 'select_model':
        model = (input.model as Template['model']) ?? 'claude-sonnet-4-6'
        break

      case 'attach_mcps': {
        const servers = (input.mcp_servers as Array<{
          name: string
          type: string
          url: string
        }>) ?? []
        mcpServers = servers.map((s) => ({
          name: s.name,
          type: 'url' as const,
          url: s.url
        }))
        const toolEntries = (input.tools as Array<Record<string, unknown>>) ?? []
        tools = toolEntries.map((t) => {
          if (t.type === 'agent_toolset_20260401') {
            return { type: 'agent_toolset_20260401' as const }
          }
          return {
            type: 'mcp_toolset' as const,
            mcp_server_name: (t.mcp_server_name as string) ?? '',
            default_config: {
              permission_policy: {
                type: ((t.default_config as Record<string, unknown>)
                  ?.permission_policy as Record<string, unknown>)
                  ?.type as 'always_allow' | 'always_deny' | 'ask_user' ??
                  'ask_user'
              }
            }
          }
        })
        // Ensure agent_toolset is always first
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
        skills = skillEntries.map((s) => ({
          type: s.type as 'anthropic' | 'community',
          skill_id: s.skill_id
        }))
        break
      }
    }
  }

  // Try to extract a name from the system prompt or prompt
  const promptLower = intent.prompt.toLowerCase()
  if (promptLower.length < 60) {
    name = intent.prompt.slice(0, 128)
  }

  // Build the template
  const candidateTemplate = {
    name,
    description,
    model,
    system: systemPromptText,
    mcp_servers: mcpServers,
    tools,
    skills,
    metadata: { template: slugify(name) }
  }

  // Validate
  const parseResult = templateSchema.safeParse(candidateTemplate)

  if (parseResult.success) {
    return {
      template: parseResult.data,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens
    }
  }

  if (!isRetry) {
    // Fix common issues and retry
    if (!candidateTemplate.system || candidateTemplate.system.length === 0) {
      candidateTemplate.system =
        'You are a helpful agent. Follow the user instructions carefully.'
    }
    if (candidateTemplate.tools.length === 0) {
      candidateTemplate.tools = [{ type: 'agent_toolset_20260401' }]
    }

    const retryResult = templateSchema.safeParse(candidateTemplate)
    if (retryResult.success) {
      return {
        template: retryResult.data,
        tokensIn: response.usage.input_tokens,
        tokensOut: response.usage.output_tokens
      }
    }

    // Full retry with the API
    return callWithRetry(client, systemPrompt, intent, mcps, true)
  }

  // Final fallback: force-build a valid template
  const fallback: Template = {
    name,
    description,
    model: 'claude-sonnet-4-6',
    system:
      systemPromptText ||
      'You are a helpful agent. Follow the user instructions carefully.',
    mcp_servers: [],
    tools: [{ type: 'agent_toolset_20260401' }],
    skills: [],
    metadata: { template: slugify(name) }
  }

  return {
    template: fallback,
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens
  }
}
