import {
  buildAgentspaceDomainCapabilityManifest,
  buildAgentspaceHostRouteProjection,
  getAgentspaceKitOperationByToolId,
  getAgentspaceKitOperationByTypedId,
  listAgentspaceKitOperations,
  runAgentspaceKitOperationByToolId,
  type AgentspaceKitOperationSpec,
} from '@aopslab/domain-kit-agentspace'

export interface AgentspaceToolingToolSpec {
  readonly toolId: string
  readonly operationId: string
  readonly title: string
  readonly summary?: string
}

function normalizeAgentspaceToolId(toolId: string): string {
  return String(toolId ?? '').trim().toLowerCase()
}

function toToolSpec(operation: AgentspaceKitOperationSpec): AgentspaceToolingToolSpec {
  return {
    toolId: normalizeAgentspaceToolId(operation.toolId),
    operationId: operation.operationId,
    title: operation.summary ?? operation.operationId,
    summary: operation.summary,
  }
}

export function listAgentspaceToolingOperations(): readonly AgentspaceKitOperationSpec[] {
  return listAgentspaceKitOperations()
}

export function listAgentspaceToolingTools(): readonly AgentspaceToolingToolSpec[] {
  return listAgentspaceToolingOperations().map(toToolSpec)
}

export function resolveAgentspaceOperationIdByToolId(toolId: string): string | undefined {
  return getAgentspaceKitOperationByToolId(normalizeAgentspaceToolId(toolId))?.operationId ?? undefined
}

export function getAgentspaceOperationSpecById(
  operationId: string,
): AgentspaceKitOperationSpec | undefined {
  return getAgentspaceKitOperationByTypedId(operationId) ?? undefined
}

export async function runAgentspaceOperationById(
  operationId: string,
  input?: unknown,
): Promise<unknown> {
  const operation = getAgentspaceKitOperationByTypedId(operationId)
  if (!operation) {
    throw new Error(`unknown_agentspace_operation:${operationId}`)
  }
  return runAgentspaceKitOperationByToolId(operation.toolId, input)
}

export async function runAgentspaceToolById(toolId: string, input?: unknown): Promise<unknown> {
  const normalizedToolId = normalizeAgentspaceToolId(toolId)
  if (!getAgentspaceKitOperationByToolId(normalizedToolId)) {
    throw new Error(`unknown_agentspace_tool:${toolId}`)
  }
  return runAgentspaceKitOperationByToolId(normalizedToolId, input)
}

export interface AgentspaceAgentManifest {
  readonly domainId: 'agentspace'
  readonly tools: readonly AgentspaceToolingToolSpec[]
  readonly routes: ReturnType<typeof buildAgentspaceHostRouteProjection>
}

export function buildAgentspaceAgentManifest(): AgentspaceAgentManifest {
  return {
    domainId: 'agentspace',
    tools: listAgentspaceToolingTools(),
    routes: buildAgentspaceHostRouteProjection(),
  }
}

export {
  buildAgentspaceDomainCapabilityManifest,
  buildAgentspaceHostRouteProjection,
  type AgentspaceKitOperationSpec,
}
