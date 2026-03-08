import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortTask } from '../ports/repository-ports/index.js'
import type { ITaskServicePort, ITaskCommentServicePort, TaskCreateInput } from '../ports/inbound/index.js'
import { TaskServiceError } from '../errors/TaskServiceError.js'
import { IbmTask, IbmTaskInsert, IbmTaskComment, IbmTaskCommentInsert, taskZodSchemaInsert, taskCommentZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

export interface TaskServiceOptions {
  taskRepository: IRepositoryPortTask
  taskCommentService: ITaskCommentServicePort
  logger?: XfLogger
  locale?: string
}

export class TaskService implements ITaskServicePort {
  private readonly taskRepository: IRepositoryPortTask
  private readonly taskCommentService: ITaskCommentServicePort
  private readonly logger?: XfLogger

  constructor(options: TaskServiceOptions) {
    this.taskRepository = options.taskRepository
    this.taskCommentService = options.taskCommentService
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmTask>): Effect.Effect<IbmTask | null, TaskServiceError> {
    const stage = 'TaskService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.taskRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmTaskInsert): Effect.Effect<IbmTask, TaskServiceError> {
    const stage = 'TaskService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: taskZodSchemaInsert,
          stage,
          operation: 'TaskService::create.taskZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => {
        if (data.position === undefined || data.position === null) {
          return pipe(
            this.searchTasks({ columnId: data.columnId }, { sort: [{ field: 'position', type: 'desc' }], limit: 1 }),
            Effect.map((items) => {
              const next = items?.[0]?.position ?? -1
              return { ...data, position: next + 1 }
            })
          )
        }
        return Effect.succeed(data)
      }),
      Effect.flatMap((data) => this.taskRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }

  getTask(id: string, options?: DbQueryOptions<IbmTask>): Effect.Effect<IbmTask | null, TaskServiceError> {
    return this.getById(id, options)
  }

  createTask(data: TaskCreateInput): Effect.Effect<IbmTask, TaskServiceError> {
    const stage = 'TaskService::createTask'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((payload) => this.create(payload as IbmTaskInsert))
    )
  }

  updateTask(id: string, patch: Partial<IbmTask>): Effect.Effect<IbmTask, TaskServiceError> {
    const stage = 'TaskService::updateTask'
    if (!patch || Object.keys(patch).length === 0) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'patch', stage }))
    }
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((entityId) =>
        validateBmInputWithSchema({
          input: patch,
          schema: taskZodSchemaInsert.partial().strict(),
          stage,
          operation: 'TaskService::updateTask.taskZodSchemaInsert.patch',
          field: 'patch',
        }).pipe(
          Effect.map(() => entityId)
        )
      ),
      Effect.flatMap((taskId) => this.taskRepository.patchById(taskId, patch).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in updateTask')
      }))
    )
  }

  setTaskPriority(id: string, priority: number | null): Effect.Effect<IbmTask, TaskServiceError> {
    const stage = 'TaskService::setTaskPriority'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap(() => this.updateTask(id, { priority: priority === null ? (null as any) : priority }))
    )
  }

  setTaskAssignee(id: string, assignee: string | null): Effect.Effect<IbmTask, TaskServiceError> {
    const stage = 'TaskService::setTaskAssignee'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap(() => this.updateTask(id, { assignee: assignee === null ? (null as any) : assignee }))
    )
  }

  setTaskDueDate(id: string, dueAt: Date | null): Effect.Effect<IbmTask, TaskServiceError> {
    const stage = 'TaskService::setTaskDueDate'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap(() => this.updateTask(id, { dueAt: dueAt === null ? (null as any) : dueAt }))
    )
  }

  setTaskParent(id: string, parentTaskId: string | null): Effect.Effect<IbmTask, TaskServiceError> {
    const stage = 'TaskService::setTaskParent'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap(() => this.updateTask(id, { parentTaskId: parentTaskId === null ? (null as any) : parentTaskId }))
    )
  }

  linkTaskToSprint(id: string, sprintId: string): Effect.Effect<IbmTask, TaskServiceError> {
    const stage = 'TaskService::linkTaskToSprint'
    return pipe(
      validateInput(sprintId, 'sprintId', { stage }),
      Effect.flatMap(() => this.updateTask(id, { sprintId }))
    )
  }

  unlinkTaskFromSprint(id: string): Effect.Effect<IbmTask, TaskServiceError> {
    const stage = 'TaskService::unlinkTaskFromSprint'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap(() => this.updateTask(id, { sprintId: null as any }))
    )
  }

  searchTasks(
    filter: Partial<IbmTask> = {},
    options?: DbQueryOptions<IbmTask>
  ): Effect.Effect<IbmTask[], TaskServiceError> {
    const stage = 'TaskService::searchTasks'
    const queryOptions = options?.sort
      ? options
      : { ...options, sort: [{ field: 'position', type: 'asc' }] }
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((filter) => this.taskRepository.find({ matchEq: filter, options: queryOptions } as any).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in searchTasks')
      }))
    )
  }

  reorderTasksInColumn(columnId: string, orderedTaskIds: string[]): Effect.Effect<number, TaskServiceError> {
    const stage = 'TaskService::reorderTasksInColumn'
    const tempBase = 1000000
    return pipe(
      validateInput(columnId, 'columnId', { stage }),
      Effect.flatMap(() => validateInput(orderedTaskIds, 'orderedTaskIds', { stage })),
      Effect.flatMap(() =>
        Effect.forEach(
          orderedTaskIds,
          (id, index) =>
            this.taskRepository.patchById(id, { columnId, position: tempBase + index } as any).pipe(
              Effect.mapError(mapDbError({ stage, operation: 'patchById(temp)', factory: XfErrorFactory.upsertFailed }))
            ),
          { concurrency: 1 }
        )
      ),
      Effect.flatMap(() =>
        Effect.forEach(
          orderedTaskIds,
          (id, index) =>
            this.taskRepository.patchById(id, { position: index } as any).pipe(
              Effect.mapError(mapDbError({ stage, operation: 'patchById(final)', factory: XfErrorFactory.upsertFailed }))
            ),
          { concurrency: 1 }
        )
      ),
      Effect.map(() => orderedTaskIds.length),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in reorderTasksInColumn')
      }))
    )
  }

  reorderTask(taskId: string, toPosition: number): Effect.Effect<IbmTask, TaskServiceError> {
    const stage = 'TaskService::reorderTask'
    return pipe(
      validateInput(taskId, 'taskId', { stage }),
      Effect.flatMap(() =>
        this.getById(taskId).pipe(
          Effect.flatMap((task) =>
            task
              ? Effect.succeed(task)
              : Effect.fail(XfErrorFactory.notFound({ stage, identifier: taskId }))
          )
        )
      ),
      Effect.flatMap((task) =>
        this.searchTasks({ columnId: task.columnId }, { sort: [{ field: 'position', type: 'asc' }] }).pipe(
          Effect.map((tasks) => {
            const ids = tasks.map((t) => t.id).filter((id): id is string => !!id)
            const filtered = ids.filter((id) => id !== taskId)
            const index = Math.max(0, Math.min(filtered.length, toPosition))
            filtered.splice(index, 0, taskId)
            return { task, orderedIds: filtered }
          })
        )
      ),
      Effect.flatMap(({ task, orderedIds }) =>
        this.reorderTasksInColumn(task.columnId, orderedIds).pipe(Effect.as(task))
      ),
      Effect.flatMap(() =>
        this.getById(taskId).pipe(
          Effect.flatMap((updated) =>
            updated
              ? Effect.succeed(updated)
              : Effect.fail(XfErrorFactory.notFound({ stage, identifier: taskId }))
          )
        )
      )
    )
  }

  moveTaskToColumn(taskId: string, toColumnId: string, toPosition?: number): Effect.Effect<IbmTask, TaskServiceError> {
    const stage = 'TaskService::moveTaskToColumn'
    return pipe(
      validateInput(taskId, 'taskId', { stage }),
      Effect.flatMap(() => validateInput(toColumnId, 'toColumnId', { stage })),
      Effect.flatMap(() =>
        this.getById(taskId).pipe(
          Effect.flatMap((task) =>
            task
              ? Effect.succeed(task)
              : Effect.fail(XfErrorFactory.notFound({ stage, identifier: taskId }))
          )
        )
      ),
      Effect.flatMap((task) =>
        this.searchTasks({ columnId: toColumnId }, { sort: [{ field: 'position', type: 'asc' }] }).pipe(
          Effect.map((tasks) => {
            const ids = tasks.map((t) => t.id).filter((id): id is string => !!id)
            const filtered = ids.filter((id) => id !== taskId)
            const index =
              typeof toPosition === 'number' && Number.isFinite(toPosition)
                ? Math.max(0, Math.min(filtered.length, toPosition))
                : filtered.length
            filtered.splice(index, 0, taskId)
            return { task, orderedIds: filtered }
          })
        )
      ),
      Effect.flatMap(({ task, orderedIds }) =>
        this.reorderTasksInColumn(toColumnId, orderedIds).pipe(Effect.as(task))
      ),
      Effect.flatMap(() =>
        this.getById(taskId).pipe(
          Effect.flatMap((updated) =>
            updated
              ? Effect.succeed(updated)
              : Effect.fail(XfErrorFactory.notFound({ stage, identifier: taskId }))
          )
        )
      )
    )
  }

  addTaskComment(data: IbmTaskCommentInsert): Effect.Effect<IbmTaskComment, TaskServiceError> {
    const stage = 'TaskService::addTaskComment'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: taskCommentZodSchemaInsert,
          stage,
          operation: 'TaskService::addTaskComment.taskCommentZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((payload) =>
        this.taskCommentService.create(payload).pipe(
          Effect.mapError((cause) => XfErrorFactory.createFailed({ stage, operation: 'taskCommentService.create', cause }))
        )
      )
    )
  }

  listTaskComments(taskId: string, options?: DbQueryOptions<IbmTaskComment>): Effect.Effect<IbmTaskComment[], TaskServiceError> {
    const stage = 'TaskService::listTaskComments'
    return pipe(
      validateInput(taskId, 'taskId', { stage }),
      Effect.flatMap(() =>
        this.taskCommentService.listByTask(taskId, options).pipe(
          Effect.mapError((cause) => XfErrorFactory.notFound({ stage, operation: 'taskCommentService.listByTask', cause }))
        )
      )
    )
  }
}
