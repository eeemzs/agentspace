import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'
import { agentRunTable } from '../../agentRun/drizzle/drizzle.schema.agentRun.js'
import { projectTable } from '../../project/drizzle/drizzle.schema.project.js'
import { workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.js'

export const agentRunEventTable = pgTable(
  'agent-run-events',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: uuid().references(() => projectTable.id, { onDelete: 'set null' }),
    agentRunId: uuid()
      .notNull()
      .references(() => agentRunTable.id, { onDelete: 'cascade' }),
    runId: text().notNull(),
    eventId: text().notNull(),
    sequence: integer().notNull(),
    eventType: text().notNull(),
    status: text(),
    payload: jsonb(),
    meta: jsonb(),
    emittedAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex('agent_run_event_unique_run_sequence').on(t.tenantId, t.agentRunId, t.sequence),
    index('agent_run_event_idx_workspace_emitted').on(t.tenantId, t.workspaceId, t.emittedAt),
    index('agent_run_event_idx_project_emitted').on(t.tenantId, t.projectId, t.emittedAt),
    index('agent_run_event_idx_run_id').on(t.tenantId, t.runId),
    index('agent_run_event_idx_type').on(t.tenantId, t.eventType),
  ]
)

export type IdbAgentRunEventDrizzle = InferSelectModel<typeof agentRunEventTable>
export type AgentRunEventColumnsDrizzle = keyof IdbAgentRunEventDrizzle
