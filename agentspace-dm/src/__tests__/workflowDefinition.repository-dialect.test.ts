import { afterEach, describe, expect, it } from 'vitest'
import { Effect } from 'effect'
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { drizzleSqliteDisconnect } from '@aopslab/xf-db-drizzle'

import { inferDrizzleDialectFromRepositoryConfig } from '../application/factories/drizzleDialect.js'
import { WorkflowDefinitionDrizzleSqliteRepo } from '../infrastructure/repositories/workflowDefinition/drizzle/WorkflowDefinitionDrizzleSqliteRepo.js'

const tempDirs: string[] = []

afterEach(async () => {
  await drizzleSqliteDisconnect()
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (!dir) continue
    rmSync(dir, { recursive: true, force: true })
  }
})

function createWorkflowDefinitionSqliteFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'agentspace-workflow-definition-'))
  tempDirs.push(dir)
  const dbPath = join(dir, 'agentspace.sqlite')
  const db = new DatabaseSync(dbPath)

  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE workspaces (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      name TEXT NOT NULL
    );
    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      workspaceId TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    );
    CREATE TABLE "workflow-definitions" (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      workspaceId TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      projectId TEXT REFERENCES projects(id) ON DELETE SET NULL,
      definitionId TEXT NOT NULL,
      name TEXT NOT NULL,
      mode TEXT NOT NULL,
      subjectType TEXT,
      runtimeProfile TEXT,
      steps TEXT NOT NULL,
      policies TEXT,
      meta TEXT,
      createdAt INTEGER,
      updatedAt INTEGER
    );
    CREATE UNIQUE INDEX workflow_definition_unique_definition_id
      ON "workflow-definitions" (tenantId, workspaceId, definitionId);
    INSERT INTO workspaces (id, tenantId, name)
      VALUES ('ws-1', 'tenant-1', 'Test Workspace');
  `)
  db.close()

  return {
    dbPath,
    repo: new WorkflowDefinitionDrizzleSqliteRepo({
      repositoryConfig: {
        repositoryType: 'drizzle',
        drizzleDialect: 'sqlite',
        tenantId: 'tenant-1',
        workspaceId: 'ws-1',
        url: `file:${dbPath}`,
      },
    }),
  }
}

describe('workflowDefinition repository dialect support', () => {
  it('infers postgres and sqlite repository dialects from config', () => {
    expect(
      inferDrizzleDialectFromRepositoryConfig({ url: 'postgresql://user:pass@localhost:5432/aops' })
    ).toBe('pg')
    expect(
      inferDrizzleDialectFromRepositoryConfig({ url: 'file:/tmp/agentspace.sqlite' })
    ).toBe('sqlite')
    expect(
      inferDrizzleDialectFromRepositoryConfig({ drizzleDialect: 'sqlite', url: 'postgresql://ignored' })
    ).toBe('sqlite')
  })

  it('creates workflow definitions through the sqlite repository owner chain', async () => {
    const { repo } = createWorkflowDefinitionSqliteFixture()

    const created = await Effect.runPromise(
      repo.create({
        workspaceId: 'ws-1',
        projectId: null,
        definitionId: 'wf-sqlite-template',
        name: 'SQLite Template Workflow',
        mode: 'template',
        subjectType: 'projectman.issue',
        runtimeProfile: 'ops-triage',
        steps: [{ stepId: 'triage-customer-message', kind: 'run-turn' }],
        policies: null,
        meta: { source: 'dialect-test' },
      } as any)
    )

    expect(created).toMatchObject({
      workspaceId: 'ws-1',
      projectId: null,
      definitionId: 'wf-sqlite-template',
      name: 'SQLite Template Workflow',
    })
  })
})
