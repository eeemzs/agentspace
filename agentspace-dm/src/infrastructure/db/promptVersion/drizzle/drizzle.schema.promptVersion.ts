import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { promptTable } from '../../prompt/drizzle/drizzle.schema.prompt.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const promptVersionTable = pgTable(
  'prompt-versions',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    promptId: uuid()
      .notNull()
      .references(() => promptTable.id, { onDelete: 'cascade' }),
    version: integer().notNull(),
    status: text().notNull(),
    content: text().notNull(),
    variables: jsonb(),
    meta: jsonb(),
    refType: text(),
    refId: text(),
    createdBy: text(),
    updatedBy: text(),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('prompt_version_unique').on(t.tenantId, t.promptId, t.version),
    index('prompt_version_idx_tenant').on(t.tenantId),
    index('prompt_version_idx_workspace').on(t.tenantId, t.workspaceId),
    index('prompt_version_idx_prompt').on(t.tenantId, t.promptId),
  ]
)

export type IdbPromptVersionDrizzle = InferSelectModel<typeof promptVersionTable>;
export type PromptVersionColumnsDrizzle = keyof IdbPromptVersionDrizzle;
