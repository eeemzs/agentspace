import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const skillTableSqlite = sqliteTable(
  'skills',
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
    shortDescription: text(),
    tags: text({ mode: 'json' }).$type<string[]>(),
    currentVersionId: text(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('skill_scope_name_tenant_unique').on(t.tenantId, t.workspaceId, t.scopeType, t.scopeId, t.name),
    index('skill_idx_tenant').on(t.tenantId),
    index('skill_idx_workspace').on(t.tenantId, t.workspaceId),
    index('skill_idx_project').on(t.tenantId, t.projectId),
  ]
)

export type IdbSkillDrizzleSqlite = InferSelectModel<typeof skillTableSqlite>;
export type SkillColumnsDrizzleSqlite = keyof IdbSkillDrizzleSqlite;
