import {
  listAgentspaceBackupSchemaCoverage,
  listAgentspaceBackupSections,
  type AgentspaceBackupSectionDefinition,
} from '@aopslab/domain-dm-agentspace'

export type AgentspaceBackupCapabilityCatalog = {
  domain: 'agentspace'
  owner: 'dm'
  sections: AgentspaceBackupSectionDefinition[]
  schemaCoverage: {
    includedTables: string[]
  }
}

export function listAgentspaceBackupCapabilityCatalog(): AgentspaceBackupCapabilityCatalog {
  return {
    domain: 'agentspace',
    owner: 'dm',
    sections: listAgentspaceBackupSections(),
    schemaCoverage: listAgentspaceBackupSchemaCoverage(),
  }
}
