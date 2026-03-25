import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const resourceTableSqlite = sqliteTable(
  'resources',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: text().references(() => projectTable.id, { onDelete: 'set null' }),
    scopeType: text().notNull(),
    scopeId: text(),
    name: text().notNull(),
    description: text(),
    resourceType: text().notNull(),
    uri: text(),
    tags: text({ mode: 'json' }).$type<string[]>(),
    refType: text(),
    refId: text(),
    meta: text({ mode: 'json' }),
    createdBy: text(),
    updatedBy: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('resource_workspace_ref_unique').on(t.tenantId, t.workspaceId, t.refType, t.refId),
    index('resource_idx_tenant').on(t.tenantId),
    index('resource_idx_workspace').on(t.tenantId, t.workspaceId),
    index('resource_idx_project').on(t.tenantId, t.projectId),
    index('resource_idx_scope').on(t.tenantId, t.scopeType, t.scopeId),
  ]
)

export type IdbResourceDrizzleSqlite = InferSelectModel<typeof resourceTableSqlite>;
export type ResourceColumnsDrizzleSqlite = keyof IdbResourceDrizzleSqlite;
