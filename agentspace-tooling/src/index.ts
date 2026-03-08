import {
  buildAgentspaceDomainCapabilityManifest,
  buildAgentspaceHostRouteProjection,
  getAgentspaceKitOperationByToolId,
  getAgentspaceKitOperationByTypedId,
  listAgentspaceKitOperations,
  runAgentspaceKitOperationByToolId,
  runAgentspaceKitOperationByTypedId,
  type AgentspaceKitOperationSpec,
} from '@aopslab/domain-kit-agentspace'

export interface AgentspaceToolingToolSpec {
  readonly toolId: string
  readonly operationId: string
  readonly title: string
  readonly summary?: string
}

function toAgentspaceToolId(toolId: string): string {
  return toolId.startsWith('aops-') ? `agentspace-${toolId.slice('aops-'.length)}` : toolId
}

function toAopsToolId(toolId: string): string {
  return toolId.startsWith('agentspace-') ? `aops-${toolId.slice('agentspace-'.length)}` : toolId
}

function toToolSpec(operation: AgentspaceKitOperationSpec): AgentspaceToolingToolSpec {
  return {
    toolId: toAgentspaceToolId(operation.toolId),
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
  return getAgentspaceKitOperationByToolId(toAopsToolId(toolId))?.operationId ?? undefined
}

export function getAgentspaceOperationSpecById(
  operationId: string,
): AgentspaceKitOperationSpec | undefined {
  return getAgentspaceKitOperationByTypedId(operationId)
}

export async function runAgentspaceOperationById(
  operationId: string,
  input?: unknown,
): Promise<unknown> {
  return runAgentspaceKitOperationByTypedId(operationId, input)
}

export async function runAgentspaceToolById(toolId: string, input?: unknown): Promise<unknown> {
  const aopsToolId = toAopsToolId(toolId)
  if (!getAgentspaceKitOperationByToolId(aopsToolId)) {
    throw new Error(`unknown_agentspace_tool:${toolId}`)
  }
  return runAgentspaceKitOperationByToolId(aopsToolId, input)
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
