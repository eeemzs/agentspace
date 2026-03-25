export type AgentspaceBackupSectionKey =
  | 'workspace-shell'
  | 'project-shell'
  | 'prompts'
  | 'skills'
  | 'resources'
  | 'memory'

export type AgentspaceBackupSectionDefinition = {
  key: AgentspaceBackupSectionKey
  label: string
  description: string
  selectionScope: 'workspace' | 'project' | 'workspace-or-project'
  tableNames: string[]
  restoreOrder: string[]
  dependencyTableNames?: string[]
}

export type AgentspaceBackupSectionSelection = {
  workspaceIds: string[]
  projectIds: string[]
  sectionKeys: AgentspaceBackupSectionKey[]
}

export type AgentspaceBackupRow = Record<string, unknown>

export type AgentspaceBackupTableSnapshot = {
  sectionKey: AgentspaceBackupSectionKey | 'dependency'
  name: string
  columns: string[]
  rows: AgentspaceBackupRow[]
}

export type AgentspaceBackupReadAdapter = {
  readAll(tableName: string): AgentspaceBackupRow[]
  readColumns(tableName: string): string[]
  readByIds(tableName: string, column: string, ids: string[]): AgentspaceBackupRow[]
}

export type AgentspaceBackupDeletePlan = {
  matchColumn: 'id' | 'promptId' | 'skillId'
  ids: string[]
}

export type AgentspaceRestoreScope = {
  workspaceIds: Set<string>
  projectIds: Set<string>
  promptIds: Set<string>
  skillIds: Set<string>
}

export const AGENTSPACE_BACKUP_SECTION_DEFINITIONS: AgentspaceBackupSectionDefinition[] = [
  {
    key: 'workspace-shell',
    label: 'Workspace kayitlari',
    description: 'Secilen workspace satirlari',
    selectionScope: 'workspace',
    tableNames: ['workspaces'],
    restoreOrder: ['workspaces'],
  },
  {
    key: 'project-shell',
    label: 'Project kayitlari',
    description: 'Secilen project satirlari',
    selectionScope: 'project',
    tableNames: ['projects'],
    restoreOrder: ['projects'],
    dependencyTableNames: ['workspaces'],
  },
  {
    key: 'prompts',
    label: 'Prompts',
    description: 'Prompts ve prompt versions',
    selectionScope: 'workspace-or-project',
    tableNames: ['prompts', 'prompt-versions'],
    restoreOrder: ['prompts', 'prompt-versions'],
    dependencyTableNames: ['workspaces', 'projects'],
  },
  {
    key: 'skills',
    label: 'Skills',
    description: 'Skills ve skill versions',
    selectionScope: 'workspace-or-project',
    tableNames: ['skills', 'skill-versions'],
    restoreOrder: ['skills', 'skill-versions'],
    dependencyTableNames: ['workspaces', 'projects'],
  },
  {
    key: 'resources',
    label: 'Resources',
    description: 'Workspace/project resources',
    selectionScope: 'workspace-or-project',
    tableNames: ['resources'],
    restoreOrder: ['resources'],
    dependencyTableNames: ['workspaces', 'projects'],
  },
  {
    key: 'memory',
    label: 'Memory',
    description: 'Agentspace memory kayitlari',
    selectionScope: 'workspace-or-project',
    tableNames: ['memory-items'],
    restoreOrder: ['memory-items'],
    dependencyTableNames: ['workspaces', 'projects'],
  },
]

const AGENTSPACE_BACKUP_TABLE_NAMES = new Set([
  'workspaces',
  'projects',
  'prompts',
  'prompt-versions',
  'skills',
  'skill-versions',
  'resources',
  'memory-items',
])

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

function toNonEmpty(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function collectIds(rows: AgentspaceBackupRow[], column: string): string[] {
  return unique(
    rows.map((row) => toNonEmpty(row[column])).filter((entry): entry is string => Boolean(entry)),
  ).sort((left, right) => left.localeCompare(right))
}

function filterRowsByScope(
  rows: AgentspaceBackupRow[],
  workspaceIds: string[],
  projectIds: string[],
): AgentspaceBackupRow[] {
  return rows.filter((row) => {
    const workspaceId = toNonEmpty(row.workspaceId)
    const projectId = toNonEmpty(row.projectId)
    if (projectIds.length > 0) return Boolean(projectId && projectIds.includes(projectId))
    if (workspaceIds.length > 0) return Boolean(workspaceId && workspaceIds.includes(workspaceId))
    return true
  })
}

function pushTable(
  target: AgentspaceBackupTableSnapshot[],
  table: AgentspaceBackupTableSnapshot,
): void {
  if (table.rows.length === 0) return
  target.push(table)
}

export function listAgentspaceBackupSections(): AgentspaceBackupSectionDefinition[] {
  return AGENTSPACE_BACKUP_SECTION_DEFINITIONS.map((entry) => ({ ...entry }))
}

export function listAgentspaceBackupSchemaCoverage(): {
  includedTables: string[]
} {
  return {
    includedTables: Array.from(AGENTSPACE_BACKUP_TABLE_NAMES).sort((left, right) => left.localeCompare(right)),
  }
}

export function exportAgentspaceBackupTables(params: {
  read: AgentspaceBackupReadAdapter
  workspaceIds: string[]
  projectIds: string[]
  sectionKeys: AgentspaceBackupSectionKey[]
}): {
  dependencies: AgentspaceBackupTableSnapshot[]
  tables: AgentspaceBackupTableSnapshot[]
} {
  const bySection = new Set(params.sectionKeys)
  const dependencies: AgentspaceBackupTableSnapshot[] = []
  const tables: AgentspaceBackupTableSnapshot[] = []

  const workspaceRows = params.read
    .readAll('workspaces')
    .filter((row) => params.workspaceIds.includes(String(row.id ?? '')))
  const projectRows = params.read
    .readAll('projects')
    .filter((row) => params.projectIds.includes(String(row.id ?? '')))

  pushTable(dependencies, {
    sectionKey: 'dependency',
    name: 'workspaces',
    columns: params.read.readColumns('workspaces'),
    rows: workspaceRows,
  })
  pushTable(dependencies, {
    sectionKey: 'dependency',
    name: 'projects',
    columns: params.read.readColumns('projects'),
    rows: projectRows,
  })

  if (bySection.has('workspace-shell')) {
    pushTable(tables, {
      sectionKey: 'workspace-shell',
      name: 'workspaces',
      columns: params.read.readColumns('workspaces'),
      rows: workspaceRows,
    })
  }

  if (bySection.has('project-shell')) {
    pushTable(tables, {
      sectionKey: 'project-shell',
      name: 'projects',
      columns: params.read.readColumns('projects'),
      rows: projectRows,
    })
  }

  if (bySection.has('prompts')) {
    const promptRows = filterRowsByScope(
      params.read.readAll('prompts'),
      params.workspaceIds,
      params.projectIds,
    )
    const promptIds = collectIds(promptRows, 'id')
    pushTable(tables, {
      sectionKey: 'prompts',
      name: 'prompts',
      columns: params.read.readColumns('prompts'),
      rows: promptRows,
    })
    pushTable(tables, {
      sectionKey: 'prompts',
      name: 'prompt-versions',
      columns: params.read.readColumns('prompt-versions'),
      rows: params.read.readByIds('prompt-versions', 'promptId', promptIds),
    })
  }

  if (bySection.has('skills')) {
    const skillRows = filterRowsByScope(
      params.read.readAll('skills'),
      params.workspaceIds,
      params.projectIds,
    )
    const skillIds = collectIds(skillRows, 'id')
    pushTable(tables, {
      sectionKey: 'skills',
      name: 'skills',
      columns: params.read.readColumns('skills'),
      rows: skillRows,
    })
    pushTable(tables, {
      sectionKey: 'skills',
      name: 'skill-versions',
      columns: params.read.readColumns('skill-versions'),
      rows: params.read.readByIds('skill-versions', 'skillId', skillIds),
    })
  }

  if (bySection.has('resources')) {
    pushTable(tables, {
      sectionKey: 'resources',
      name: 'resources',
      columns: params.read.readColumns('resources'),
      rows: filterRowsByScope(
        params.read.readAll('resources'),
        params.workspaceIds,
        params.projectIds,
      ),
    })
  }

  if (bySection.has('memory')) {
    pushTable(tables, {
      sectionKey: 'memory',
      name: 'memory-items',
      columns: params.read.readColumns('memory-items'),
      rows: filterRowsByScope(
        params.read.readAll('memory-items'),
        params.workspaceIds,
        params.projectIds,
      ),
    })
  }

  return { dependencies, tables }
}

function decodeTableRows(
  tables: AgentspaceBackupTableSnapshot[],
  tableName: string,
): AgentspaceBackupRow[] {
  return tables.find((entry) => entry.name === tableName)?.rows ?? []
}

export function computeAgentspaceRestoreScope(params: {
  tables: AgentspaceBackupTableSnapshot[]
  workspaceIds: string[]
  projectIds: string[]
}): AgentspaceRestoreScope {
  const workspaceRows = decodeTableRows(params.tables, 'workspaces').filter((row) =>
    params.workspaceIds.includes(String(row.id ?? '')),
  )
  const projectRows = decodeTableRows(params.tables, 'projects').filter((row) => {
    const id = String(row.id ?? '')
    const workspaceId = String(row.workspaceId ?? '')
    if (params.projectIds.length > 0) return params.projectIds.includes(id)
    return params.workspaceIds.includes(workspaceId)
  })
  const promptRows = filterRowsByScope(
    decodeTableRows(params.tables, 'prompts'),
    params.workspaceIds,
    params.projectIds,
  )
  const skillRows = filterRowsByScope(
    decodeTableRows(params.tables, 'skills'),
    params.workspaceIds,
    params.projectIds,
  )

  return {
    workspaceIds: new Set(collectIds(workspaceRows, 'id')),
    projectIds: new Set(collectIds(projectRows, 'id')),
    promptIds: new Set(collectIds(promptRows, 'id')),
    skillIds: new Set(collectIds(skillRows, 'id')),
  }
}

export function filterAgentspaceRestoreRows(params: {
  tableName: string
  rows: AgentspaceBackupRow[]
  scope: AgentspaceRestoreScope
  workspaceIds: string[]
  projectIds: string[]
}): AgentspaceBackupRow[] {
  if (params.tableName === 'workspaces') {
    return params.rows.filter((row) => params.scope.workspaceIds.has(String(row.id ?? '')))
  }
  if (params.tableName === 'projects') {
    return params.rows.filter((row) => params.scope.projectIds.has(String(row.id ?? '')))
  }
  if (params.tableName === 'prompt-versions') {
    return params.rows.filter((row) => params.scope.promptIds.has(String(row.promptId ?? '')))
  }
  if (params.tableName === 'skill-versions') {
    return params.rows.filter((row) => params.scope.skillIds.has(String(row.skillId ?? '')))
  }
  return filterRowsByScope(params.rows, params.workspaceIds, params.projectIds)
}

export function resolveAgentspaceBackupDeletePlan(
  tableName: string,
  rows: AgentspaceBackupRow[],
): AgentspaceBackupDeletePlan | null {
  if (!AGENTSPACE_BACKUP_TABLE_NAMES.has(tableName)) return null
  if (tableName === 'prompt-versions') {
    const promptIds = collectIds(rows, 'promptId')
    return promptIds.length > 0 ? { matchColumn: 'promptId', ids: promptIds } : null
  }
  if (tableName === 'skill-versions') {
    const skillIds = collectIds(rows, 'skillId')
    return skillIds.length > 0 ? { matchColumn: 'skillId', ids: skillIds } : null
  }
  const ids = collectIds(rows, 'id')
  return ids.length > 0 ? { matchColumn: 'id', ids } : null
}
