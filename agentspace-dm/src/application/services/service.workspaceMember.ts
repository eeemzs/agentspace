import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortWorkspaceMember } from '../ports/repository-ports/index.js'
import type { IWorkspaceMemberServicePort } from '../ports/inbound/index.js'
import { WorkspaceMemberServiceError } from '../errors/WorkspaceMemberServiceError.js'
import { IbmWorkspaceMember, IbmWorkspaceMemberInsert, workspaceMemberZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

export interface WorkspaceMemberServiceDependencies {}

export interface WorkspaceMemberServiceOptions {
  workspaceMemberRepository: IRepositoryPortWorkspaceMember
  serviceDependencies?: Partial<WorkspaceMemberServiceDependencies>
  logger?: XfLogger
  locale?: string
}

export class WorkspaceMemberService implements IWorkspaceMemberServicePort {
  private readonly workspaceMemberRepository: IRepositoryPortWorkspaceMember
  private readonly logger?: XfLogger

  constructor(options: WorkspaceMemberServiceOptions) {
    this.workspaceMemberRepository = options.workspaceMemberRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmWorkspaceMember>): Effect.Effect<IbmWorkspaceMember | null, WorkspaceMemberServiceError> {
    const stage = 'WorkspaceMemberService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.workspaceMemberRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmWorkspaceMemberInsert): Effect.Effect<IbmWorkspaceMember, WorkspaceMemberServiceError> {
    const stage = 'WorkspaceMemberService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: workspaceMemberZodSchemaInsert,
          stage,
          operation: 'WorkspaceMemberService::create.workspaceMemberZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => this.workspaceMemberRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }

  listWorkspaceMembers(
    filter: Partial<IbmWorkspaceMember> = {},
    options?: DbQueryOptions<IbmWorkspaceMember>
  ): Effect.Effect<IbmWorkspaceMember[], WorkspaceMemberServiceError> {
    const stage = 'WorkspaceMemberService::listWorkspaceMembers'
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((filter) => this.workspaceMemberRepository.find({ matchEq: filter, options } as any).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in listWorkspaceMembers')
      }))
    )
  }

  updateWorkspaceMember(id: string, patch: Partial<IbmWorkspaceMember>): Effect.Effect<IbmWorkspaceMember, WorkspaceMemberServiceError> {
    const stage = 'WorkspaceMemberService::updateWorkspaceMember'
    if (!patch || Object.keys(patch).length === 0) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'patch', stage }))
    }

    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((entityId) =>
        validateBmInputWithSchema({
          input: patch,
          schema: workspaceMemberZodSchemaInsert.partial().strict(),
          stage,
          operation: 'WorkspaceMemberService::updateWorkspaceMember.workspaceMemberZodSchemaInsert.patch',
          field: 'patch',
        }).pipe(
          Effect.map(() => entityId)
        )
      ),
      Effect.flatMap((memberId) => this.workspaceMemberRepository.patchById(memberId, patch).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in updateWorkspaceMember')
      }))
    )
  }

  removeWorkspaceMember(id: string): Effect.Effect<void, WorkspaceMemberServiceError> {
    const stage = 'WorkspaceMemberService::removeWorkspaceMember'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((memberId) => this.workspaceMemberRepository.deleteById(memberId).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'deleteById', factory: XfErrorFactory.upsertFailed }))
      )),
      Effect.map(() => undefined)
    )
  }
}
