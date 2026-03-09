import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const workflowDefinitionTableSqlite = sqliteTable(
  'workflow-definitions',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: text().references(() => projectTable.id, { onDelete: 'set null' }),
    definitionId: text().notNull(),
    name: text().notNull(),
    mode: text().notNull(),
    subjectType: text(),
    runtimeProfile: text(),
    steps: text({ mode: 'json' }).$type<Array<Record<string, unknown>>>().notNull(),
    policies: text({ mode: 'json' }),
    meta: text({ mode: 'json' }),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('workflow_definition_unique_definition_id').on(t.tenantId, t.workspaceId, t.definitionId),
    index('workflow_definition_idx_workspace_mode').on(t.tenantId, t.workspaceId, t.mode),
    index('workflow_definition_idx_workspace_subject').on(t.tenantId, t.workspaceId, t.subjectType),
  ]
)

export type IdbWorkflowDefinitionDrizzleSqlite = InferSelectModel<typeof workflowDefinitionTableSqlite>
export type WorkflowDefinitionColumnsDrizzleSqlite = keyof IdbWorkflowDefinitionDrizzleSqlite
