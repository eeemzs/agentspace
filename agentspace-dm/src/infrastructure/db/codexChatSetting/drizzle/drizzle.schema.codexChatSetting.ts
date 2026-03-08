import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const codexChatSettingTable = pgTable(
  'codex-chat-settings',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    userId: text().notNull(),
    binaryPath: text(),
    model: text(),
    reasoningEffort: text(),
    profile: text(),
    executionMode: text().notNull(),
    sandboxMode: text().notNull(),
    manualCwd: text(),
    autoStart: boolean(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('codex_chat_setting_tenant_workspace_user_unique').on(t.tenantId, t.workspaceId, t.userId),
    index('codex_chat_setting_idx_tenant').on(t.tenantId),
    index('codex_chat_setting_idx_workspace_user').on(t.tenantId, t.workspaceId, t.userId),
  ]
)

export type IdbCodexChatSettingDrizzle = InferSelectModel<typeof codexChatSettingTable>
export type CodexChatSettingColumnsDrizzle = keyof IdbCodexChatSettingDrizzle
