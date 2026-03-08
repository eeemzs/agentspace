import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const resourceTable = pgTable(
  'resources',
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
    resourceType: text().notNull(),
    uri: text(),
    tags: jsonb().$type<string[]>(),
    refType: text(),
    refId: text(),
    meta: jsonb(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('resource_workspace_ref_unique').on(t.tenantId, t.workspaceId, t.refType, t.refId),
    index('resource_idx_tenant').on(t.tenantId),
    index('resource_idx_workspace').on(t.tenantId, t.workspaceId),
    index('resource_idx_project').on(t.tenantId, t.projectId),
    index('resource_idx_scope').on(t.tenantId, t.scopeType, t.scopeId),
  ]
)

export type IdbResourceDrizzle = InferSelectModel<typeof resourceTable>;
export type ResourceColumnsDrizzle = keyof IdbResourceDrizzle;
