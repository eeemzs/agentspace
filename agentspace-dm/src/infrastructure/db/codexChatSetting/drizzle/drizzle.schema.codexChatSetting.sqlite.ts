import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const codexChatSettingTableSqlite = sqliteTable(
  'codex-chat-settings',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    userId: text().notNull(),
    binaryPath: text(),
    model: text(),
    modelProvider: text(),
    reasoningEffort: text(),
    profile: text(),
    serviceTier: text(),
    personality: text(),
    approvalsReviewer: text(),
    executionMode: text().notNull(),
    sandboxMode: text().notNull(),
    manualCwd: text(),
    autoStart: integer({ mode: 'boolean' }),
    persistExtendedHistory: integer({ mode: 'boolean' }),
    experimentalApi: integer({ mode: 'boolean' }),
    optOutNotificationMethods: text(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('codex_chat_setting_tenant_workspace_user_unique').on(t.tenantId, t.workspaceId, t.userId),
    index('codex_chat_setting_idx_tenant').on(t.tenantId),
    index('codex_chat_setting_idx_workspace_user').on(t.tenantId, t.workspaceId, t.userId),
  ]
)

export type IdbCodexChatSettingDrizzleSqlite = InferSelectModel<typeof codexChatSettingTableSqlite>
export type CodexChatSettingColumnsDrizzleSqlite = keyof IdbCodexChatSettingDrizzleSqlite
