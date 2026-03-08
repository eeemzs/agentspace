import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel, sql } from 'drizzle-orm'

export const workspaceTable = pgTable(
  'workspaces',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    ownerId: uuid().notNull(),
    name: text().notNull(),
    description: text(),
    sharingEnabled: boolean().notNull().default(true),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('workspace_idx_tenant').on(t.tenantId),
    index('workspace_idx_owner').on(t.tenantId, t.ownerId),
    uniqueIndex('workspace_owner_name_tenant_unique').on(t.tenantId, t.ownerId, sql`lower(${t.name})`),
  ]
)

export type IdbWorkspaceDrizzle = InferSelectModel<typeof workspaceTable>;
export type WorkspaceColumnsDrizzle = keyof IdbWorkspaceDrizzle;
