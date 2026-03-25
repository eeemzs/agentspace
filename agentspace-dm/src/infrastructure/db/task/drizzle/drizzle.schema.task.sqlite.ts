import { InferSelectModel } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { foreignKey, index, integer, text, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { projectTableSqlite as projectTable } from '../../project/drizzle/drizzle.schema.project.sqlite.js'
import { promptVersionTableSqlite as promptVersionTable } from '../../promptVersion/drizzle/drizzle.schema.promptVersion.sqlite.js'
import { workspaceTableSqlite as workspaceTable } from '../../workspace/drizzle/drizzle.schema.workspace.sqlite.js'

export const taskTableSqlite = sqliteTable(
  'tasks',
  {
    id: text().primaryKey().$defaultFn(() => randomUUID()),
    tenantId: text().notNull(),
    workspaceId: text()
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    projectId: text()
      .notNull()
      .references(() => projectTable.id, { onDelete: 'cascade' }),
    columnId: text().notNull(),
    sprintId: text(),
    promptVersionId: text().references(() => promptVersionTable.id, { onDelete: 'set null' }),
    parentTaskId: text(),
    type: text().notNull(),
    title: text().notNull(),
    description: text(),
    input: text({ mode: 'json' }),
    meta: text({ mode: 'json' }),
    assignee: text(),
    position: integer().notNull(),
    priority: integer(),
    dueAt: integer({ mode: 'timestamp_ms' }),
    createdBy: text(),
    updatedBy: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('task_column_position_unique').on(t.tenantId, t.columnId, t.position),
    foreignKey({
      name: 'task_parent_task_fk',
      columns: [t.parentTaskId],
      foreignColumns: [t.id],
    }).onDelete('set null'),
    index('task_idx_tenant').on(t.tenantId),
    index('task_idx_workspace').on(t.tenantId, t.workspaceId),
    index('task_idx_project').on(t.tenantId, t.projectId),
    index('task_idx_column').on(t.tenantId, t.columnId),
    index('task_idx_sprint').on(t.tenantId, t.sprintId),
    index('task_idx_prompt_version').on(t.tenantId, t.promptVersionId),
    index('task_idx_parent').on(t.tenantId, t.parentTaskId),
  ]
)

export type IdbTaskDrizzleSqlite = InferSelectModel<typeof taskTableSqlite>;
export type TaskColumnsDrizzleSqlite = keyof IdbTaskDrizzleSqlite;
