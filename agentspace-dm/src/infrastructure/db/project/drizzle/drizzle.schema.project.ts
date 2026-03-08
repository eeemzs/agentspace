import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const projectTable = pgTable(
  'projects',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    description: text(),
    tags: jsonb().$type<string[]>(),
    slug: text(),
    status: text(),
    visibility: text(),
    projectType: text(),
    ownerId: text(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('project_slug_tenant_unique').on(t.tenantId, t.workspaceId, t.slug),
    index('project_idx_tenant').on(t.tenantId),
    index('project_idx_workspace').on(t.tenantId, t.workspaceId),
  ]
)

export type IdbProjectDrizzle = InferSelectModel<typeof projectTable>;
export type ProjectColumnsDrizzle = keyof IdbProjectDrizzle;
