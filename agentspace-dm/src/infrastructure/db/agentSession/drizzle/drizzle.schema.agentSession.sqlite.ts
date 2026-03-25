import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const agentSessionTableSqlite = sqliteTable(
  'agent-sessions',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: text().references(() => projectTable.id, { onDelete: 'set null' }),
    sessionId: text().notNull(),
    agent: text().notNull(),
    profile: text(),
    model: text(),
    status: text().notNull(),
    startedAt: integer({ mode: 'timestamp_ms' }),
    endedAt: integer({ mode: 'timestamp_ms' }),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    index('agent_session_idx_tenant').on(t.tenantId),
    index('agent_session_idx_workspace').on(t.tenantId, t.workspaceId),
    index('agent_session_idx_project_started').on(t.tenantId, t.projectId, t.startedAt),
  ]
)

export type IdbAgentSessionDrizzleSqlite = InferSelectModel<typeof agentSessionTableSqlite>;
export type AgentSessionColumnsDrizzleSqlite = keyof IdbAgentSessionDrizzleSqlite;
