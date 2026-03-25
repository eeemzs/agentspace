import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const memoryItemTableSqlite = sqliteTable(
  'memory-items',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: text().references(() => projectTable.id, { onDelete: 'set null' }),
    scopeType: text().notNull().default('project'),
    scopeId: text(),
    kind: text().notNull(),
    content: text().notNull(),
    tags: text({ mode: 'json' }).$type<string[]>(),
    importance: integer(),
    sourceType: text(),
    sourceId: text(),
    meta: text({ mode: 'json' }),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    index('memory_item_idx_tenant').on(t.tenantId),
    index('memory_item_idx_workspace').on(t.tenantId, t.workspaceId),
    index('memory_item_idx_project').on(t.tenantId, t.projectId),
    index('memory_item_idx_scope').on(t.tenantId, t.scopeType, t.scopeId),
    index('memory_item_idx_kind').on(t.tenantId, t.kind),
  ]
)

export type IdbMemoryItemDrizzleSqlite = InferSelectModel<typeof memoryItemTableSqlite>;
export type MemoryItemColumnsDrizzleSqlite = keyof IdbMemoryItemDrizzleSqlite;
