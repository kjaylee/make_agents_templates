/**
 * Forge — Zod validators for agent template YAML.
 * Matches the shape of docs/seeds/*.yaml and Anthropic Managed Agents API.
 */
import { z } from 'zod'

export const permissionPolicySchema = z.object({
  type: z.enum(['always_allow', 'always_deny', 'ask_user'])
})

export const mcpServerSchema = z.object({
  name: z.string().min(1).max(64),
  type: z.literal('url'),
  url: z.string().url()
})

export const agentToolsetSchema = z.object({
  type: z.literal('agent_toolset_20260401')
})

export const mcpToolsetSchema = z.object({
  type: z.literal('mcp_toolset'),
  mcp_server_name: z.string(),
  default_config: z.object({
    permission_policy: permissionPolicySchema
  })
})

export const toolSchema = z.discriminatedUnion('type', [
  agentToolsetSchema,
  mcpToolsetSchema
])

export const skillSchema = z.object({
  type: z.enum(['anthropic', 'community']),
  skill_id: z.string().min(1)
})

export const templateMetadataSchema = z.object({
  template: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case')
})

/**
 * Full template YAML contract.
 * Run via `templateSchema.parse(parsedYaml)`.
 */
export const templateSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().min(1).max(500),
  model: z.enum([
    'claude-opus-4-6',
    'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001',
    'gpt-4o',
    'gpt-4o-mini',
    'gemini-2.0-flash',
    'gemini-2.0-pro',
    'gemini-2.0-ultra'
  ]),
  system: z.union([z.string(), z.array(z.string())]),
  mcp_servers: z.array(mcpServerSchema).optional().default([]),
  tools: z.array(toolSchema).min(1),
  skills: z.array(skillSchema).optional().default([]),
  metadata: templateMetadataSchema
})

export type Template = z.infer<typeof templateSchema>
export type TemplateMcpServer = z.infer<typeof mcpServerSchema>
export type TemplateTool = z.infer<typeof toolSchema>
export type TemplateSkill = z.infer<typeof skillSchema>
