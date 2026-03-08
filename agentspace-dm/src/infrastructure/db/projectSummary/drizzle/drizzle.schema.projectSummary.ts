import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const projectSummaryTable = pgTable(
  'project-summaries',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: uuid()
      .notNull()
      .references(() => projectTable.id, { onDelete: 'cascade' }),
    summary: text(),
    decisions: jsonb(),
    openItems: jsonb(),
    lastRunId: text(),
    lastSessionId: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('project_summary_project_unique').on(t.tenantId, t.projectId),
    index('project_summary_idx_tenant').on(t.tenantId),
    index('project_summary_idx_workspace').on(t.tenantId, t.workspaceId),
  ]
)

export type IdbProjectSummaryDrizzle = InferSelectModel<typeof projectSummaryTable>;
export type ProjectSummaryColumnsDrizzle = keyof IdbProjectSummaryDrizzle;
