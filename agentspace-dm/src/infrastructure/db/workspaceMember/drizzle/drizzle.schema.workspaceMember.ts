import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const workspaceMemberTable = pgTable(
  'workspace-members',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    userId: uuid().notNull(),
    role: text().notNull(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('workspace_member_unique_user').on(t.tenantId, t.workspaceId, t.userId),
    index('workspace_member_idx_tenant').on(t.tenantId),
    index('workspace_member_idx_workspace').on(t.tenantId, t.workspaceId),
    index('workspace_member_idx_user').on(t.tenantId, t.userId),
  ]
)

export type IdbWorkspaceMemberDrizzle = InferSelectModel<typeof workspaceMemberTable>;
export type WorkspaceMemberColumnsDrizzle = keyof IdbWorkspaceMemberDrizzle;
