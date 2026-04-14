import type { UniversalAgentConfig } from '../universalSchema'

export function exportOpenAIJson(config: UniversalAgentConfig): string {
  const tools: Array<{ type: string }> = []

  for (const tool of config.tools) {
    if (tool.type === 'code_interpreter' || tool.type === 'file_search') {
      tools.push({ type: tool.type })
    } else if (tool.type === 'mcp_toolset' || tool.type === 'agent_toolset_20260401') {
      // Map MCP tools to function-calling stubs
      tools.push({ type: 'function' })
    }
  }

  if (tools.length === 0) {
    tools.push({ type: 'code_interpreter' })
  }

  const modelMap: Record<string, string> = {
    'claude-opus-4-6': 'gpt-4o',
    'claude-sonnet-4-6': 'gpt-4o',
    'claude-haiku-4-5-20251001': 'gpt-4o-mini',
    'gemini-2.0-ultra': 'gpt-4o',
    'gemini-2.0-pro': 'gpt-4o',
    'gemini-2.0-flash': 'gpt-4o-mini'
  }

  const openaiModel = modelMap[config.model] ?? config.model

  const assistant = {
    name: config.name,
    description: config.description,
    model: openaiModel,
    instructions: config.instructions.join('\n'),
    tools,
    metadata: config.metadata,
    file_ids: [] as string[],
    response_format: { type: 'text' }
  }

  return JSON.stringify(assistant, null, 2)
}
