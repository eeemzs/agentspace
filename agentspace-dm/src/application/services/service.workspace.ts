import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortWorkspace } from '../ports/repository-ports/index.js'
import type { IWorkspaceServicePort } from '../ports/inbound/index.js'
import { WorkspaceServiceError } from '../errors/WorkspaceServiceError.js'
import { IbmWorkspace, IbmWorkspaceInsert, workspaceZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

export interface WorkspaceServiceDependencies {}

export interface WorkspaceServiceOptions {
  workspaceRepository: IRepositoryPortWorkspace
  serviceDependencies?: Partial<WorkspaceServiceDependencies>
  logger?: XfLogger
  locale?: string
}

function normalizeWorkspaceName(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ')
}

export class WorkspaceService implements IWorkspaceServicePort {
  private readonly workspaceRepository: IRepositoryPortWorkspace
  private readonly logger?: XfLogger

  constructor(options: WorkspaceServiceOptions) {
    this.workspaceRepository = options.workspaceRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmWorkspace>): Effect.Effect<IbmWorkspace | null, WorkspaceServiceError> {
    const stage = 'WorkspaceService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.workspaceRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmWorkspaceInsert): Effect.Effect<IbmWorkspace, WorkspaceServiceError> {
    const stage = 'WorkspaceService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: workspaceZodSchemaInsert,
          stage,
          operation: 'WorkspaceService::create.workspaceZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data): Effect.Effect<IbmWorkspace, WorkspaceServiceError> => {
        const normalizedName = normalizeWorkspaceName((data as any).name)
        if (!normalizedName) {
          return Effect.fail(XfErrorFactory.inputRequired({ field: 'name', stage }))
        }

        const payload = { ...data, name: normalizedName } as IbmWorkspaceInsert
        return this.workspaceRepository.create(payload).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
        )
      })
    )
  }

  listWorkspaces(
    filter: Partial<IbmWorkspace> = {},
    options?: DbQueryOptions<IbmWorkspace>
  ): Effect.Effect<IbmWorkspace[], WorkspaceServiceError> {
    const stage = 'WorkspaceService::listWorkspaces'
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((filter) => this.workspaceRepository.find({ matchEq: filter, options } as any).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in listWorkspaces')
      }))
    )
  }

  updateWorkspace(id: string, patch: Partial<IbmWorkspace>): Effect.Effect<IbmWorkspace, WorkspaceServiceError> {
    const stage = 'WorkspaceService::updateWorkspace'
    if (!patch || Object.keys(patch).length === 0) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'patch', stage }))
    }

    const normalizedPatch: Partial<IbmWorkspace> = { ...patch }
    if (Object.prototype.hasOwnProperty.call(patch, 'name')) {
      const normalizedName = normalizeWorkspaceName((patch as any).name)
      if (!normalizedName) {
        return Effect.fail(XfErrorFactory.inputRequired({ field: 'name', stage }))
      }
      normalizedPatch.name = normalizedName as any
    }

    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((entityId) =>
        validateBmInputWithSchema({
          input: patch,
          schema: workspaceZodSchemaInsert.partial().strict(),
          stage,
          operation: 'WorkspaceService::updateWorkspace.workspaceZodSchemaInsert.patch',
          field: 'patch',
        }).pipe(
          Effect.map(() => entityId)
        )
      ),
      Effect.flatMap((workspaceId) =>
        this.workspaceRepository.patchById(workspaceId, normalizedPatch).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in updateWorkspace')
      }))
    )
  }

  removeWorkspace(id: string): Effect.Effect<void, WorkspaceServiceError> {
    const stage = 'WorkspaceService::removeWorkspace'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((workspaceId) => this.workspaceRepository.deleteById(workspaceId).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'deleteById', factory: XfErrorFactory.upsertFailed }))
      )),
      Effect.map(() => undefined)
    )
  }
}
