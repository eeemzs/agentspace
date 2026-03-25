import { describe, expect, it } from 'vitest'

import {
  computeAgentspaceRestoreScope,
  exportAgentspaceBackupTables,
  filterAgentspaceRestoreRows,
  resolveAgentspaceBackupDeletePlan,
  type AgentspaceBackupReadAdapter,
} from '../agentspace-backup-contract.js'

function createReadAdapter(tables: Record<string, Record<string, unknown>[]>): AgentspaceBackupReadAdapter {
  return {
    readAll(tableName) {
      return (tables[tableName] ?? []).map((row) => ({ ...row }))
    },
    readColumns(tableName) {
      const row = (tables[tableName] ?? [])[0] ?? {}
      return Object.keys(row)
    },
    readByIds(tableName, column, ids) {
      return (tables[tableName] ?? [])
        .filter((row) => ids.includes(String(row[column] ?? '')))
        .map((row) => ({ ...row }))
    },
  }
}

describe('agentspace backup contract', () => {
  it('exports prompts with prompt versions for the selected scope', () => {
    const read = createReadAdapter({
      workspaces: [{ id: 'ws-1', name: 'Default' }],
      projects: [{ id: 'pr-1', workspaceId: 'ws-1', name: 'aops' }],
      prompts: [
        { id: 'prompt-1', workspaceId: 'ws-1', projectId: 'pr-1' },
        { id: 'prompt-2', workspaceId: 'ws-1', projectId: 'pr-2' },
      ],
      'prompt-versions': [
        { id: 'pv-1', promptId: 'prompt-1' },
        { id: 'pv-2', promptId: 'prompt-2' },
      ],
    })

    const exported = exportAgentspaceBackupTables({
      read,
      workspaceIds: ['ws-1'],
      projectIds: ['pr-1'],
      sectionKeys: ['prompts'],
    })

    expect(exported.dependencies.map((entry) => entry.name)).toEqual(['workspaces', 'projects'])
    expect(exported.tables.map((entry) => entry.name)).toEqual(['prompts', 'prompt-versions'])
    expect(exported.tables[0]?.rows).toHaveLength(1)
    expect(exported.tables[1]?.rows).toEqual([{ id: 'pv-1', promptId: 'prompt-1' }])
  })

  it('restores dependent rows only when the root entity is selected', () => {
    const tables = [
      {
        sectionKey: 'prompts' as const,
        name: 'prompts',
        columns: ['id', 'workspaceId', 'projectId'],
        rows: [{ id: 'prompt-1', workspaceId: 'ws-1', projectId: 'pr-1' }],
      },
      {
        sectionKey: 'prompts' as const,
        name: 'prompt-versions',
        columns: ['id', 'promptId'],
        rows: [
          { id: 'pv-1', promptId: 'prompt-1' },
          { id: 'pv-2', promptId: 'prompt-2' },
        ],
      },
    ]

    const scope = computeAgentspaceRestoreScope({
      tables,
      workspaceIds: ['ws-1'],
      projectIds: ['pr-1'],
    })

    const filtered = filterAgentspaceRestoreRows({
      tableName: 'prompt-versions',
      rows: tables[1]!.rows,
      scope,
      workspaceIds: ['ws-1'],
      projectIds: ['pr-1'],
    })

    expect(filtered).toEqual([{ id: 'pv-1', promptId: 'prompt-1' }])
  })

  it('builds delete plans from owner semantics', () => {
    expect(
      resolveAgentspaceBackupDeletePlan('prompt-versions', [
        { id: 'pv-1', promptId: 'prompt-1' },
        { id: 'pv-2', promptId: 'prompt-1' },
      ]),
    ).toEqual({
      matchColumn: 'promptId',
      ids: ['prompt-1'],
    })

    expect(
      resolveAgentspaceBackupDeletePlan('resources', [
        { id: 'resource-1' },
        { id: 'resource-2' },
      ]),
    ).toEqual({
      matchColumn: 'id',
      ids: ['resource-1', 'resource-2'],
    })
  })
})
