import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { index, integer, text, sqliteTable } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { taskTableSqlite as taskTable } from '../../task/drizzle/drizzle.schema.task.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const taskCommentTableSqlite = sqliteTable(
  'task-comments',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: text()
      .notNull()
      .references(() => projectTable.id, { onDelete: 'cascade' }),
    taskId: text()
      .notNull()
      .references(() => taskTable.id, { onDelete: 'cascade' }),
    author: text().notNull(),
    body: text().notNull(),
    meta: text({ mode: 'json' }),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    index('task_comment_idx_tenant').on(t.tenantId),
    index('task_comment_idx_workspace').on(t.tenantId, t.workspaceId),
    index('task_comment_idx_project').on(t.tenantId, t.projectId),
    index('task_comment_idx_task').on(t.tenantId, t.taskId),
  ]
)

export type IdbTaskCommentDrizzleSqlite = InferSelectModel<typeof taskCommentTableSqlite>;
export type TaskCommentColumnsDrizzleSqlite = keyof IdbTaskCommentDrizzleSqlite;
