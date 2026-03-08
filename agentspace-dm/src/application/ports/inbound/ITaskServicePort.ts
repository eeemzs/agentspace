import { Effect } from 'effect'
import { TaskServiceError } from '../../errors/TaskServiceError.js'
import { IbmTask, IbmTaskInsert, IbmTaskComment, IbmTaskCommentInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export type TaskCreateInput = Omit<IbmTaskInsert, 'position'> & { position?: number }

export interface ITaskServicePort {
  getById(id: string, options?: DbQueryOptions<IbmTask>): Effect.Effect<IbmTask | null, TaskServiceError>
  create(data: IbmTaskInsert): Effect.Effect<IbmTask, TaskServiceError>
  getTask(id: string, options?: DbQueryOptions<IbmTask>): Effect.Effect<IbmTask | null, TaskServiceError>
  createTask(data: TaskCreateInput): Effect.Effect<IbmTask, TaskServiceError>
  updateTask(id: string, patch: Partial<IbmTask>): Effect.Effect<IbmTask, TaskServiceError>
  setTaskPriority(id: string, priority: number | null): Effect.Effect<IbmTask, TaskServiceError>
  setTaskAssignee(id: string, assignee: string | null): Effect.Effect<IbmTask, TaskServiceError>
  setTaskDueDate(id: string, dueAt: Date | null): Effect.Effect<IbmTask, TaskServiceError>
  setTaskParent(id: string, parentTaskId: string | null): Effect.Effect<IbmTask, TaskServiceError>
  linkTaskToSprint(id: string, sprintId: string): Effect.Effect<IbmTask, TaskServiceError>
  unlinkTaskFromSprint(id: string): Effect.Effect<IbmTask, TaskServiceError>
  reorderTask(taskId: string, toPosition: number): Effect.Effect<IbmTask, TaskServiceError>
  moveTaskToColumn(taskId: string, toColumnId: string, toPosition?: number): Effect.Effect<IbmTask, TaskServiceError>
  reorderTasksInColumn(columnId: string, orderedTaskIds: string[]): Effect.Effect<number, TaskServiceError>
  addTaskComment(data: IbmTaskCommentInsert): Effect.Effect<IbmTaskComment, TaskServiceError>
  listTaskComments(taskId: string, options?: DbQueryOptions<IbmTaskComment>): Effect.Effect<IbmTaskComment[], TaskServiceError>
  searchTasks(filter?: Partial<IbmTask>, options?: DbQueryOptions<IbmTask>): Effect.Effect<IbmTask[], TaskServiceError>
}

export interface ITaskLookupPort {
  getById(id: string): Effect.Effect<IbmTask | null, TaskServiceError>
}
