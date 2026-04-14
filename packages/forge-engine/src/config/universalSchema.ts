import type { ProviderType } from '../providers/types'

export interface UniversalTool {
  type: string
  name?: string
  serverName?: string
  permissionPolicy?: 'always_allow' | 'always_deny' | 'ask_user'
}

export interface DataSource {
  type: 'mcp' | 'api' | 'file' | 'database'
  name: string
  url?: string
  config?: Record<string, string>
}

export interface UniversalAgentConfig {
  name: string
  description: string
  instructions: string[]
  model: string
  provider: ProviderType
  tools: UniversalTool[]
  dataSources: DataSource[]
  metadata: Record<string, string>
}
