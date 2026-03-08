import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const promptTable = pgTable(
  'prompts',
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
    tags: jsonb().$type<string[]>(),
    status: text().notNull().default('draft'),
    currentVersionId: uuid(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('prompt_scope_name_tenant_unique').on(t.tenantId, t.workspaceId, t.scopeType, t.scopeId, t.name),
    index('prompt_idx_tenant').on(t.tenantId),
    index('prompt_idx_workspace').on(t.tenantId, t.workspaceId),
    index('prompt_idx_project').on(t.tenantId, t.projectId),
  ]
)

export type IdbPromptDrizzle = InferSelectModel<typeof promptTable>;
export type PromptColumnsDrizzle = keyof IdbPromptDrizzle;
