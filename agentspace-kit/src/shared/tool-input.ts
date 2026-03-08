type ToolInputRecord = Record<string, unknown>

export const WORKSPACE_ALIAS_KEYS = ['workspaceId', 'workspaceUuid', 'workspaceUid', 'workspaceName'] as const

export function toRecord(input: unknown): ToolInputRecord {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as ToolInputRecord
}

export function normalizeNonEmpty(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function hasNonEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as ToolInputRecord).length > 0
  return true
}

export function resolveWorkspaceAliasValue(input: ToolInputRecord): string | undefined {
  return (
    normalizeNonEmpty(input.workspaceId) ??
    normalizeNonEmpty(input.workspaceUuid) ??
    normalizeNonEmpty(input.workspaceUid) ??
    normalizeNonEmpty(input.workspaceName)
  )
}

export function isWorkspaceArgName(argName: string): boolean {
  return argName === 'workspaceId' || argName === 'data.workspaceId'
}

export function toMissingRequiredArgToken(argName: string): string {
  if (isWorkspaceArgName(argName)) return 'workspace_context_required'
  return `missing_required_arg:${argName}`
}

