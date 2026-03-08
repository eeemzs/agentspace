import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const codexChatThreadTable = pgTable(
  'codex-chat-threads',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: uuid().references(() => projectTable.id, { onDelete: 'set null' }),
    externalThreadId: text().notNull(),
    scopeLabel: text(),
    cwd: text(),
    title: text(),
    tags: jsonb().$type<string[]>(),
    lastPrompt: text(),
    lastAssistant: text(),
    tokenInput: integer(),
    tokenOutput: integer(),
    tokenTotal: integer(),
    lastMessageAt: timestamp({ withTimezone: true }),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('codex_chat_thread_tenant_workspace_external_unique').on(
      t.tenantId,
      t.workspaceId,
      t.externalThreadId
    ),
    index('codex_chat_thread_idx_tenant').on(t.tenantId),
    index('codex_chat_thread_idx_workspace_updated').on(t.tenantId, t.workspaceId, t.updatedAt),
    index('codex_chat_thread_idx_project_updated').on(t.tenantId, t.projectId, t.updatedAt),
  ]
)

export type IdbCodexChatThreadDrizzle = InferSelectModel<typeof codexChatThreadTable>
export type CodexChatThreadColumnsDrizzle = keyof IdbCodexChatThreadDrizzle
