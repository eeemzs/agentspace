import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { skillSetTableSqlite as skillSetTable } from '../../skillSet/drizzle/drizzle.schema.skillSet.sqlite.js'
import { skillVersionTableSqlite as skillVersionTable } from '../../skillVersion/drizzle/drizzle.schema.skillVersion.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const skillSetItemTableSqlite = sqliteTable(
  'skill-set-items',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    skillSetId: text()
      .notNull()
      .references(() => skillSetTable.id, { onDelete: 'cascade' }),
    skillVersionId: text()
      .notNull()
      .references(() => skillVersionTable.id, { onDelete: 'cascade' }),
    position: integer().notNull(),
    meta: text({ mode: 'json' }),
    createdBy: text(),
    updatedBy: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('skill_set_item_position_unique').on(t.tenantId, t.skillSetId, t.position),
    index('skill_set_item_idx_workspace').on(t.tenantId, t.workspaceId),
    index('skill_set_item_idx_skill_set').on(t.tenantId, t.skillSetId),
    index('skill_set_item_idx_skill_version').on(t.tenantId, t.skillVersionId),
  ]
)

export type IdbSkillSetItemDrizzleSqlite = InferSelectModel<typeof skillSetItemTableSqlite>;
export type SkillSetItemColumnsDrizzleSqlite = keyof IdbSkillSetItemDrizzleSqlite;
