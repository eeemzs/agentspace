import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { skillSetTable } from '../../skillSet/drizzle/drizzle.schema.skillSet.js'
import { skillVersionTable } from '../../skillVersion/drizzle/drizzle.schema.skillVersion.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const skillSetItemTable = pgTable(
  'skill-set-items',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    skillSetId: uuid()
      .notNull()
      .references(() => skillSetTable.id, { onDelete: 'cascade' }),
    skillVersionId: uuid()
      .notNull()
      .references(() => skillVersionTable.id, { onDelete: 'cascade' }),
    position: integer().notNull(),
    meta: jsonb(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('skill_set_item_position_unique').on(t.tenantId, t.skillSetId, t.position),
    index('skill_set_item_idx_workspace').on(t.tenantId, t.workspaceId),
    index('skill_set_item_idx_skill_set').on(t.tenantId, t.skillSetId),
    index('skill_set_item_idx_skill_version').on(t.tenantId, t.skillVersionId),
  ]
)

export type IdbSkillSetItemDrizzle = InferSelectModel<typeof skillSetItemTable>;
export type SkillSetItemColumnsDrizzle = keyof IdbSkillSetItemDrizzle;
