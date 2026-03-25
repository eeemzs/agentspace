import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const promptTableSqlite = sqliteTable(
  'prompts',
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
    tags: text({ mode: 'json' }).$type<string[]>(),
    status: text().notNull().default('draft'),
    currentVersionId: text(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('prompt_scope_name_tenant_unique').on(t.tenantId, t.workspaceId, t.scopeType, t.scopeId, t.name),
    index('prompt_idx_tenant').on(t.tenantId),
    index('prompt_idx_workspace').on(t.tenantId, t.workspaceId),
    index('prompt_idx_project').on(t.tenantId, t.projectId),
  ]
)

export type IdbPromptDrizzleSqlite = InferSelectModel<typeof promptTableSqlite>;
export type PromptColumnsDrizzleSqlite = keyof IdbPromptDrizzleSqlite;
