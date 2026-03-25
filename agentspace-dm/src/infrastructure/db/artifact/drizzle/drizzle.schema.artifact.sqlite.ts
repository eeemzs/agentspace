import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const artifactTableSqlite = sqliteTable(
  'artifacts',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: text()
      .notNull()
      .references(() => projectTable.id, { onDelete: 'cascade' }),
    artifactType: text().notNull(),
    label: text(),
    storagePath: text().notNull(),
    mimeType: text(),
    sizeBytes: integer(),
    hash: text(),
    meta: text({ mode: 'json' }),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    index('artifact_idx_tenant').on(t.tenantId),
    index('artifact_idx_workspace').on(t.tenantId, t.workspaceId),
    index('artifact_idx_project_created').on(t.tenantId, t.projectId, t.createdAt),
  ]
)

export type IdbArtifactDrizzleSqlite = InferSelectModel<typeof artifactTableSqlite>;
export type ArtifactColumnsDrizzleSqlite = keyof IdbArtifactDrizzleSqlite;
