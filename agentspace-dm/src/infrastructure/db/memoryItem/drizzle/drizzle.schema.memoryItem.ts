import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const memoryItemTable = pgTable(
  'memory-items',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: uuid().references(() => projectTable.id, { onDelete: 'set null' }),
    scopeType: text().notNull().default('project'),
    scopeId: text(),
    kind: text().notNull(),
    content: text().notNull(),
    tags: jsonb().$type<string[]>(),
    importance: integer(),
    sourceType: text(),
    sourceId: text(),
    meta: jsonb(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('memory_item_idx_tenant').on(t.tenantId),
    index('memory_item_idx_workspace').on(t.tenantId, t.workspaceId),
    index('memory_item_idx_project').on(t.tenantId, t.projectId),
    index('memory_item_idx_scope').on(t.tenantId, t.scopeType, t.scopeId),
    index('memory_item_idx_kind').on(t.tenantId, t.kind),
  ]
)

export type IdbMemoryItemDrizzle = InferSelectModel<typeof memoryItemTable>;
export type MemoryItemColumnsDrizzle = keyof IdbMemoryItemDrizzle;
