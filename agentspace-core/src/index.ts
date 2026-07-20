export const AGENTSPACE_DOMAIN_ID = 'agentspace' as const

export interface AgentspaceDomainDescriptor {
  readonly domainId: typeof AGENTSPACE_DOMAIN_ID
  readonly displayName: 'Agentspace'
  readonly description: string
}

export function getAgentspaceDomainDescriptor(): AgentspaceDomainDescriptor {
  return {
    domainId: AGENTSPACE_DOMAIN_ID,
    displayName: 'Agentspace',
    description: 'Prompt, skill, resource and memory context domain extracted from AOPS.',
  }
}
