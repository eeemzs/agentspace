import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const tagTable = pgTable(
  'tags',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    scopeType: text().notNull(),
    name: text().notNull(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('tag_scope_name_tenant_unique').on(t.tenantId, t.workspaceId, t.scopeType, t.name),
    index('tag_idx_tenant').on(t.tenantId),
    index('tag_idx_workspace').on(t.tenantId, t.workspaceId),
    index('tag_idx_scope').on(t.tenantId, t.scopeType),
  ]
)

export type IdbTagDrizzle = InferSelectModel<typeof tagTable>;
export type TagColumnsDrizzle = keyof IdbTagDrizzle;
