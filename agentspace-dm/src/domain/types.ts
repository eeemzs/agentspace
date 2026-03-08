import { z } from 'zod'

export const SCOPE_TYPES = ['global', 'project'] as const
export type ScopeType = (typeof SCOPE_TYPES)[number]

export const TAG_SCOPE_TYPES = ['prompt', 'skill', 'skill-set', 'project', 'memory-item'] as const
export type TagScopeType = (typeof TAG_SCOPE_TYPES)[number]

export const RESOURCE_TYPES = ['document', 'rule', 'spec', 'link', 'reference', 'template', 'dataset', 'code', 'skill'] as const
export type ResourceType = (typeof RESOURCE_TYPES)[number]

export const PROJECT_MEMBER_ROLES = ['owner', 'editor', 'viewer'] as const
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number]

export const WORKSPACE_MEMBER_ROLES = ['owner', 'editor', 'viewer'] as const
export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[number]

export const KANBAN_STATUS_KEYS = ['backlog', 'ready', 'in_progress', 'review', 'qa', 'done', 'blocked'] as const
export type KanbanStatusKey = (typeof KANBAN_STATUS_KEYS)[number]

export const TASK_TYPES = ['epic', 'story', 'task', 'bug', 'chore', 'spike'] as const
export type TaskType = (typeof TASK_TYPES)[number]

export const SPRINT_STATUSES = ['draft', 'active', 'completed', 'superseded', 'blocked'] as const
export type SprintStatus = (typeof SPRINT_STATUSES)[number]

export const SPRINT_ITEM_STATUSES = ['draft', 'active', 'completed', 'pending', 'blocked'] as const
export type SprintItemStatus = (typeof SPRINT_ITEM_STATUSES)[number]

export const PROMPT_STATUSES = ['draft', 'published', 'archived'] as const
export type PromptStatus = (typeof PROMPT_STATUSES)[number]

export const PROMPT_VERSION_STATUSES = ['draft', 'published', 'archived'] as const
export type PromptVersionStatus = (typeof PROMPT_VERSION_STATUSES)[number]

export const SKILL_VERSION_STATUSES = ['draft', 'published', 'archived'] as const
export type SkillVersionStatus = (typeof SKILL_VERSION_STATUSES)[number]

export const AGENT_SESSION_STATUSES = ['active', 'ended', 'failed'] as const
export type AgentSessionStatus = (typeof AGENT_SESSION_STATUSES)[number]

export const ARTIFACT_TYPES = ['file', 'diff', 'log', 'report', 'doc', 'image', 'dataset', 'other'] as const
export type ArtifactType = (typeof ARTIFACT_TYPES)[number]

export const ARTIFACT_LINK_REF_TYPES = ['task', 'agent-run', 'prompt-version', 'skill-version', 'resource', 'other'] as const
export type ArtifactLinkRefType = (typeof ARTIFACT_LINK_REF_TYPES)[number]

export const MEMORY_ITEM_KINDS = ['decision', 'rule', 'note', 'lesson', 'context', 'constraint'] as const
export type MemoryItemKind = (typeof MEMORY_ITEM_KINDS)[number]

export const CODEX_CHAT_MESSAGE_ROLES = ['user', 'assistant', 'system'] as const
export type CodexChatMessageRole = (typeof CODEX_CHAT_MESSAGE_ROLES)[number]

export const CODEX_CHAT_EXECUTION_MODES = ['agent-auto', 'ask', 'safe'] as const
export type CodexChatExecutionMode = (typeof CODEX_CHAT_EXECUTION_MODES)[number]

export const CODEX_CHAT_SANDBOX_MODES = ['read-only', 'workspace-write', 'danger-full-access'] as const
export type CodexChatSandboxMode = (typeof CODEX_CHAT_SANDBOX_MODES)[number]

export const CODEX_CHAT_REASONING_EFFORTS = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'] as const
export type CodexChatReasoningEffort = (typeof CODEX_CHAT_REASONING_EFFORTS)[number]

export type ActorRef = 'manual' | `agent:${string}` | `user:${string}`

export function buildActorRef(type: 'manual' | 'agent' | 'user', id?: string): ActorRef {
  if (type === 'manual') return 'manual'
  if (!id) throw new Error(`${type} requires id`)
  return `${type}:${id}` as ActorRef
}

export const scopeableFields = {
  scopeType: z.enum(SCOPE_TYPES),
  scopeId: z.string().optional(),
} as const

// -----------------------------------------------------------------------------
// ToolPacks (xf-gen integration contracts)
// -----------------------------------------------------------------------------

export const TOOLPACK_RESOURCE_KINDS = ['resource', 'skill', 'prompt'] as const
export type ToolPackResourceKind = (typeof TOOLPACK_RESOURCE_KINDS)[number]

export type ToolPackStagePolicies = Record<string, string[]>

export interface ToolPackManifestResource {
  kind: ToolPackResourceKind
  mcpUri: string
  name: string
  displayName: string
  sourcePath: string
  tags: string[]
  category?: string
}

export interface ToolPackManifestTool {
  name: string
  mcpToolName: string
  description: string
  inputSchema: unknown
}

export interface ToolPackManifest {
  packId: string
  packVersion: string
  displayName: string
  description: string
  sourceRoot: string
  resources: ToolPackManifestResource[]
  stagePolicies: ToolPackStagePolicies
  tools: ToolPackManifestTool[]
}
