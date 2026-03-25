import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const workspaceMemberTableSqlite = sqliteTable(
  'workspace-members',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    userId: text().notNull(),
    role: text().notNull(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('workspace_member_unique_user').on(t.tenantId, t.workspaceId, t.userId),
    index('workspace_member_idx_tenant').on(t.tenantId),
    index('workspace_member_idx_workspace').on(t.tenantId, t.workspaceId),
    index('workspace_member_idx_user').on(t.tenantId, t.userId),
  ]
)

export type IdbWorkspaceMemberDrizzleSqlite = InferSelectModel<typeof workspaceMemberTableSqlite>;
export type WorkspaceMemberColumnsDrizzleSqlite = keyof IdbWorkspaceMemberDrizzleSqlite;
