import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const skillTable = pgTable(
  'skills',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: uuid().references(() => projectTable.id, { onDelete: 'set null' }),
    scopeType: text().notNull(),
    scopeId: text(),
    name: text().notNull(),
    description: text(),
    shortDescription: text(),
    tags: jsonb().$type<string[]>(),
    currentVersionId: uuid(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('skill_scope_name_tenant_unique').on(t.tenantId, t.workspaceId, t.scopeType, t.scopeId, t.name),
    index('skill_idx_tenant').on(t.tenantId),
    index('skill_idx_workspace').on(t.tenantId, t.workspaceId),
    index('skill_idx_project').on(t.tenantId, t.projectId),
  ]
)

export type IdbSkillDrizzle = InferSelectModel<typeof skillTable>;
export type SkillColumnsDrizzle = keyof IdbSkillDrizzle;
