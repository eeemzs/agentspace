import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const tagTableSqlite = sqliteTable(
  'tags',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    scopeType: text().notNull(),
    name: text().notNull(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('tag_scope_name_tenant_unique').on(t.tenantId, t.workspaceId, t.scopeType, t.name),
    index('tag_idx_tenant').on(t.tenantId),
    index('tag_idx_workspace').on(t.tenantId, t.workspaceId),
    index('tag_idx_scope').on(t.tenantId, t.scopeType),
  ]
)

export type IdbTagDrizzleSqlite = InferSelectModel<typeof tagTableSqlite>;
export type TagColumnsDrizzleSqlite = keyof IdbTagDrizzleSqlite;
