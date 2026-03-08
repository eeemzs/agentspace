import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel } from 'drizzle-orm'

export const sprintTable = pgTable(
  'sprints',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: text().notNull(),
    workspaceId: uuid().notNull(),
    projectId: uuid(),
    scopeType: text().notNull(),
    scopeId: text(),
    name: text().notNull(),
    goal: text(),
    status: text().notNull(),
    tags: jsonb().$type<string[]>(),
    createdBy: text(),
    updatedBy: text(),
    startAt: timestamp({ withTimezone: true }),
    endAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('sprint_idx_tenant').on(t.tenantId),
    index('sprint_idx_workspace').on(t.tenantId, t.workspaceId),
    index('sprint_idx_project').on(t.tenantId, t.projectId),
    index('sprint_idx_project_status_start').on(t.tenantId, t.projectId, t.status, t.startAt),
  ]
)

export type IdbSprintDrizzle = InferSelectModel<typeof sprintTable>;
export type SprintColumnsDrizzle = keyof IdbSprintDrizzle;
