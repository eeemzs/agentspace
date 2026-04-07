import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'

export const projectSummaryTableSqlite = sqliteTable(
  'project-summaries',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    projectId: text()
      .notNull()
      .references(() => projectTable.id, { onDelete: 'cascade' }),
    summary: text(),
    decisions: text({ mode: 'json' }),
    openItems: text({ mode: 'json' }),
    lastRunId: text(),
    lastSessionId: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('project_summary_project_unique').on(t.tenantId, t.projectId),
    index('project_summary_idx_tenant').on(t.tenantId),
  ]
)

export type IdbProjectSummaryDrizzleSqlite = InferSelectModel<typeof projectSummaryTableSqlite>;
export type ProjectSummaryColumnsDrizzleSqlite = keyof IdbProjectSummaryDrizzleSqlite;
