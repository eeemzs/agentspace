import { buildAgentspaceHostRouteProjection } from '@aopslab/domain-tooling-agentspace'

export interface AgentspaceHostRegistrationManifest {
  readonly domainId: 'agentspace'
  readonly packageName: '@aopslab/domain-cli-agentspace'
  readonly binary: 'agentspace'
  readonly routes: ReturnType<typeof buildAgentspaceHostRouteProjection>
}

export function buildAgentspaceHostRegistrationManifest(): AgentspaceHostRegistrationManifest {
  return {
    domainId: 'agentspace',
    packageName: '@aopslab/domain-cli-agentspace',
    binary: 'agentspace',
    routes: buildAgentspaceHostRouteProjection(),
  }
}
