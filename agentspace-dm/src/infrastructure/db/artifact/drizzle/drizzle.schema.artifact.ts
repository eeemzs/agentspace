import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const artifactTable = pgTable(
  'artifacts',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: uuid()
      .notNull()
      .references(() => projectTable.id, { onDelete: 'cascade' }),
    artifactType: text().notNull(),
    label: text(),
    storagePath: text().notNull(),
    mimeType: text(),
    sizeBytes: integer(),
    hash: text(),
    meta: jsonb(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('artifact_idx_tenant').on(t.tenantId),
    index('artifact_idx_workspace').on(t.tenantId, t.workspaceId),
    index('artifact_idx_project_created').on(t.tenantId, t.projectId, t.createdAt),
  ]
)

export type IdbArtifactDrizzle = InferSelectModel<typeof artifactTable>;
export type ArtifactColumnsDrizzle = keyof IdbArtifactDrizzle;
