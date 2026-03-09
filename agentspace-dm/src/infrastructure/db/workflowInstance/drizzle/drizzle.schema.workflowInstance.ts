import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const workflowInstanceTable = pgTable(
  'workflow-instances',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: uuid().references(() => projectTable.id, { onDelete: 'set null' }),
    workflowInstanceId: text().notNull(),
    definitionId: text(),
    mode: text().notNull(),
    status: text().notNull(),
    subjectType: text().notNull(),
    subjectId: text().notNull(),
    subjectLabel: text(),
    subjectMeta: jsonb(),
    input: jsonb(),
    currentStepId: text(),
    activeApprovalId: text(),
    runtimeProfile: text(),
    runRecordIds: jsonb().$type<string[]>().notNull(),
    steps: jsonb().$type<Array<Record<string, unknown>>>().notNull(),
    definitionSnapshot: jsonb(),
    meta: jsonb(),
    openedAt: timestamp({ withTimezone: true }).notNull(),
    closedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('workflow_instance_unique_instance_id').on(t.tenantId, t.workspaceId, t.workflowInstanceId),
    index('workflow_instance_idx_workspace_status').on(t.tenantId, t.workspaceId, t.status),
    index('workflow_instance_idx_project_status').on(t.tenantId, t.projectId, t.status),
    index('workflow_instance_idx_subject').on(t.tenantId, t.subjectType, t.subjectId),
  ]
)

export type IdbWorkflowInstanceDrizzle = InferSelectModel<typeof workflowInstanceTable>
export type WorkflowInstanceColumnsDrizzle = keyof IdbWorkflowInstanceDrizzle
