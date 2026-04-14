import { stringify } from 'yaml'
import type { UniversalAgentConfig } from '../universalSchema'

export function exportClaudeYaml(config: UniversalAgentConfig): string {
  const mcpServers = config.dataSources
    .filter((ds) => ds.type === 'mcp')
    .map((ds) => ({
      name: ds.name,
      type: 'url' as const,
      url: ds.url ?? ''
    }))

  const tools: Array<Record<string, unknown>> = []
  for (const tool of config.tools) {
    if (tool.type === 'agent_toolset_20260401') {
      tools.push({ type: 'agent_toolset_20260401' })
    } else if (tool.type === 'mcp_toolset') {
      tools.push({
        type: 'mcp_toolset',
        mcp_server_name: tool.serverName ?? '',
        default_config: {
          permission_policy: {
            type: tool.permissionPolicy ?? 'ask_user'
          }
        }
      })
    }
  }

  if (!tools.some((t) => t.type === 'agent_toolset_20260401')) {
    tools.unshift({ type: 'agent_toolset_20260401' })
  }

  const skills = config.tools
    .filter((t) => t.type === 'anthropic_skill' || t.type === 'community_skill')
    .map((t) => ({
      type: t.type === 'community_skill' ? 'community' : 'anthropic',
      skill_id: t.name ?? ''
    }))

  const template = {
    name: config.name,
    description: config.description,
    model: config.model,
    system: config.instructions.join('\n'),
    mcp_servers: mcpServers,
    tools,
    skills,
    metadata: config.metadata
  }

  return stringify(template, {
    lineWidth: 120,
    defaultStringType: 'BLOCK_LITERAL',
    defaultKeyType: 'PLAIN'
  })
}
