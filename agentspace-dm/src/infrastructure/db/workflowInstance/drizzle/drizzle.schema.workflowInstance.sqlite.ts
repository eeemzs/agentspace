import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const workflowInstanceTableSqlite = sqliteTable(
  'workflow-instances',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: text().references(() => projectTable.id, { onDelete: 'set null' }),
    workflowInstanceId: text().notNull(),
    definitionId: text(),
    mode: text().notNull(),
    status: text().notNull(),
    subjectType: text().notNull(),
    subjectId: text().notNull(),
    subjectLabel: text(),
    subjectMeta: text({ mode: 'json' }),
    input: text({ mode: 'json' }),
    currentStepId: text(),
    activeApprovalId: text(),
    runtimeProfile: text(),
    runRecordIds: text({ mode: 'json' }).$type<string[]>().notNull(),
    steps: text({ mode: 'json' }).$type<Array<Record<string, unknown>>>().notNull(),
    definitionSnapshot: text({ mode: 'json' }),
    meta: text({ mode: 'json' }),
    openedAt: integer({ mode: 'timestamp_ms' }).notNull(),
    closedAt: integer({ mode: 'timestamp_ms' }),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('workflow_instance_unique_instance_id').on(t.tenantId, t.workspaceId, t.workflowInstanceId),
    index('workflow_instance_idx_workspace_status').on(t.tenantId, t.workspaceId, t.status),
    index('workflow_instance_idx_project_status').on(t.tenantId, t.projectId, t.status),
    index('workflow_instance_idx_subject').on(t.tenantId, t.subjectType, t.subjectId),
  ]
)

export type IdbWorkflowInstanceDrizzleSqlite = InferSelectModel<typeof workflowInstanceTableSqlite>
export type WorkflowInstanceColumnsDrizzleSqlite = keyof IdbWorkflowInstanceDrizzleSqlite
