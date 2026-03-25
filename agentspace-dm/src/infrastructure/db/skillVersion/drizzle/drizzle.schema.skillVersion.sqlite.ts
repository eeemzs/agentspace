import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { skillTableSqlite as skillTable } from '../../skill/drizzle/drizzle.schema.skill.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const skillVersionTableSqlite = sqliteTable(
  'skill-versions',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: text().references(() => projectTable.id, { onDelete: 'set null' }),
    skillId: text()
      .notNull()
      .references(() => skillTable.id, { onDelete: 'cascade' }),
    version: integer().notNull(),
    status: text().notNull(),
    content: text().notNull(),
    entryFile: text(),
    skillStandard: text().notNull().default('aops-skill-v1'),
    files: text({ mode: 'json' }).$type<Array<Record<string, unknown>>>(),
    meta: text({ mode: 'json' }),
    refType: text(),
    refId: text(),
    createdBy: text(),
    updatedBy: text(),
    publishedAt: integer({ mode: 'timestamp_ms' }),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('skill_version_unique').on(t.tenantId, t.skillId, t.version),
    index('skill_version_idx_tenant').on(t.tenantId),
    index('skill_version_idx_workspace').on(t.tenantId, t.workspaceId),
    index('skill_version_idx_skill').on(t.tenantId, t.skillId),
  ]
)

export type IdbSkillVersionDrizzleSqlite = InferSelectModel<typeof skillVersionTableSqlite>;
export type SkillVersionColumnsDrizzleSqlite = keyof IdbSkillVersionDrizzleSqlite;
