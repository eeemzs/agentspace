import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { codexChatThreadTable } from '../../codexChatThread/drizzle/drizzle.schema.codexChatThread.js'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const codexChatMessageTable = pgTable(
  'codex-chat-messages',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: uuid().references(() => projectTable.id, { onDelete: 'set null' }),
    threadId: uuid()
      .notNull()
      .references(() => codexChatThreadTable.id, { onDelete: 'cascade' }),
    externalThreadId: text(),
    role: text().notNull(),
    text: text().notNull(),
    turnId: text(),
    itemId: text(),
    messageAt: timestamp({ withTimezone: true }).notNull(),
    seq: integer().notNull(),
    createdBy: text(),
    updatedBy: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('codex_chat_message_tenant_thread_seq_unique').on(t.tenantId, t.threadId, t.seq),
    index('codex_chat_message_idx_tenant').on(t.tenantId),
    index('codex_chat_message_idx_thread_messageat').on(t.tenantId, t.threadId, t.messageAt),
    index('codex_chat_message_idx_workspace_messageat').on(t.tenantId, t.workspaceId, t.messageAt),
  ]
)

export type IdbCodexChatMessageDrizzle = InferSelectModel<typeof codexChatMessageTable>
export type CodexChatMessageColumnsDrizzle = keyof IdbCodexChatMessageDrizzle
