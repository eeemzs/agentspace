import { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const workflowDefinitionTable = pgTable(
  'workflow-definitions',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: uuid().references(() => projectTable.id, { onDelete: 'set null' }),
    definitionId: text().notNull(),
    name: text().notNull(),
    mode: text().notNull(),
    subjectType: text(),
    runtimeProfile: text(),
    steps: jsonb().$type<Array<Record<string, unknown>>>().notNull(),
    policies: jsonb(),
    meta: jsonb(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('workflow_definition_unique_definition_id').on(t.tenantId, t.workspaceId, t.definitionId),
    index('workflow_definition_idx_workspace_mode').on(t.tenantId, t.workspaceId, t.mode),
    index('workflow_definition_idx_workspace_subject').on(t.tenantId, t.workspaceId, t.subjectType),
  ]
)

export type IdbWorkflowDefinitionDrizzle = InferSelectModel<typeof workflowDefinitionTable>
export type WorkflowDefinitionColumnsDrizzle = keyof IdbWorkflowDefinitionDrizzle
