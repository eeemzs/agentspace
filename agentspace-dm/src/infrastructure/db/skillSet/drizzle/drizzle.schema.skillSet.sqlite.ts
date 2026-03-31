import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const skillSetTableSqlite = sqliteTable(
  'skill-sets',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    scopeId: text().notNull(),
    name: text().notNull(),
    description: text(),
    tags: text({ mode: 'json' }).$type<string[]>(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('skill_set_scope_name_tenant_unique').on(t.tenantId, t.scopeId, t.name),
    index('skill_set_idx_tenant').on(t.tenantId),
    index('skill_set_idx_scope').on(t.tenantId, t.scopeId),
  ]
)

export type IdbSkillSetDrizzleSqlite = InferSelectModel<typeof skillSetTableSqlite>;
export type SkillSetColumnsDrizzleSqlite = keyof IdbSkillSetDrizzleSqlite;
