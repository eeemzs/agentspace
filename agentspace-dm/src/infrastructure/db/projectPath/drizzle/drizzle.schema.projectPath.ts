import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const projectPathTable = pgTable(
  'project-paths',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: uuid()
      .notNull()
      .references(() => projectTable.id, { onDelete: 'cascade' }),
    pathKey: text().notNull(),
    path: text().notNull(),
    description: text(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('project_path_unique_key').on(t.tenantId, t.projectId, t.pathKey),
    index('project_path_idx_tenant').on(t.tenantId),
    index('project_path_idx_workspace').on(t.tenantId, t.workspaceId),
    index('project_path_idx_project').on(t.tenantId, t.projectId),
  ]
)

export type IdbProjectPathDrizzle = InferSelectModel<typeof projectPathTable>;
export type ProjectPathColumnsDrizzle = keyof IdbProjectPathDrizzle;
