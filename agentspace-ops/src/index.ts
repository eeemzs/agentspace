import { listAgentspaceKitOperations } from '@aopslab/domain-kit-agentspace'

export interface AgentspaceOperationalSurfaceSummary {
  readonly domainId: 'agentspace'
  readonly operationCount: number
}

export function describeAgentspaceOperationalSurface(): AgentspaceOperationalSurfaceSummary {
  return {
    domainId: 'agentspace',
    operationCount: listAgentspaceKitOperations().length,
  }
}
