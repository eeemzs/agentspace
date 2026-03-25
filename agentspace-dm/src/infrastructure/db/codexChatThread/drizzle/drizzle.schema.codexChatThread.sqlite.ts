import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const codexChatThreadTableSqlite = sqliteTable(
  'codex-chat-threads',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: text().references(() => projectTable.id, { onDelete: 'set null' }),
    externalThreadId: text().notNull(),
    scopeLabel: text(),
    cwd: text(),
    title: text(),
    tags: text({ mode: 'json' }).$type<string[]>(),
    lastPrompt: text(),
    lastAssistant: text(),
    tokenInput: integer(),
    tokenOutput: integer(),
    tokenTotal: integer(),
    lastMessageAt: integer({ mode: 'timestamp_ms' }),
    createdBy: text(),
    updatedBy: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
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

export type IdbCodexChatThreadDrizzleSqlite = InferSelectModel<typeof codexChatThreadTableSqlite>
export type CodexChatThreadColumnsDrizzleSqlite = keyof IdbCodexChatThreadDrizzleSqlite
