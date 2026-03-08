export const AGENTSPACE_DOMAIN_ID = 'agentspace' as const

export interface AgentspaceWorkspaceDescriptor {
  readonly domainId: typeof AGENTSPACE_DOMAIN_ID
  readonly displayName: 'Agentspace'
  readonly description: string
}

export function getAgentspaceWorkspaceDescriptor(): AgentspaceWorkspaceDescriptor {
  return {
    domainId: AGENTSPACE_DOMAIN_ID,
    displayName: 'Agentspace',
    description: 'Prompt, skill, resource and memory workspace domain extracted from AOPS.',
  }
}
