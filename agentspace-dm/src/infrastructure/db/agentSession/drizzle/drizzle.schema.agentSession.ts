import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const agentSessionTable = pgTable(
  'agent-sessions',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: uuid().references(() => projectTable.id, { onDelete: 'set null' }),
    sessionId: text().notNull(),
    agent: text().notNull(),
    profile: text(),
    model: text(),
    status: text().notNull(),
    startedAt: timestamp({ withTimezone: true }),
    endedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('agent_session_idx_tenant').on(t.tenantId),
    index('agent_session_idx_workspace').on(t.tenantId, t.workspaceId),
    index('agent_session_idx_project_started').on(t.tenantId, t.projectId, t.startedAt),
  ]
)

export type IdbAgentSessionDrizzle = InferSelectModel<typeof agentSessionTable>;
export type AgentSessionColumnsDrizzle = keyof IdbAgentSessionDrizzle;
