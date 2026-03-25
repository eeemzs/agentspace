import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable } from 'drizzle-orm/sqlite-core'
export const sprintTableSqlite = sqliteTable(
  'sprints',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text().notNull(),
    projectId: text(),
    scopeType: text().notNull(),
    scopeId: text(),
    name: text().notNull(),
    goal: text(),
    status: text().notNull(),
    tags: text({ mode: 'json' }).$type<string[]>(),
    createdBy: text(),
    updatedBy: text(),
    startAt: integer({ mode: 'timestamp_ms' }),
    endAt: integer({ mode: 'timestamp_ms' }),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    index('sprint_idx_tenant').on(t.tenantId),
    index('sprint_idx_workspace').on(t.tenantId, t.workspaceId),
    index('sprint_idx_project').on(t.tenantId, t.projectId),
    index('sprint_idx_project_status_start').on(t.tenantId, t.projectId, t.status, t.startAt),
  ]
)

export type IdbSprintDrizzleSqlite = InferSelectModel<typeof sprintTableSqlite>;
export type SprintColumnsDrizzleSqlite = keyof IdbSprintDrizzleSqlite;
