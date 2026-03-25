import { InferSelectModel, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
export const workspaceTableSqlite = sqliteTable(
  'workspaces',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    ownerId: text().notNull(),
    name: text().notNull(),
    description: text(),
    sharingEnabled: integer({ mode: 'boolean' }).notNull().default(true),
    createdBy: text(),
    updatedBy: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    index('workspace_idx_tenant').on(t.tenantId),
    index('workspace_idx_owner').on(t.tenantId, t.ownerId),
    uniqueIndex('workspace_owner_name_tenant_unique').on(t.tenantId, t.ownerId, sql`lower(${t.name})`),
  ]
)

export type IdbWorkspaceDrizzleSqlite = InferSelectModel<typeof workspaceTableSqlite>;
export type WorkspaceColumnsDrizzleSqlite = keyof IdbWorkspaceDrizzleSqlite;
