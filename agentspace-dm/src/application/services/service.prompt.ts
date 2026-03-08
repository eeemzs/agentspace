import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortPrompt } from '../ports/repository-ports/index.js'
import type { IPromptServicePort } from '../ports/inbound/index.js'
import { PromptServiceError } from '../errors/PromptServiceError.js'
import { IbmPrompt, IbmPromptInsert, promptZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

export interface PromptServiceDependencies {}

export interface PromptServiceOptions {
  promptRepository: IRepositoryPortPrompt
  serviceDependencies?: Partial<PromptServiceDependencies>
  logger?: XfLogger
  locale?: string
}

export class PromptService implements IPromptServicePort {
  private readonly promptRepository: IRepositoryPortPrompt
  private readonly logger?: XfLogger

  constructor(options: PromptServiceOptions) {
    this.promptRepository = options.promptRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmPrompt>): Effect.Effect<IbmPrompt | null, PromptServiceError> {
    const stage = 'PromptService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.promptRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmPromptInsert): Effect.Effect<IbmPrompt, PromptServiceError> {
    const stage = 'PromptService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: promptZodSchemaInsert,
          stage,
          operation: 'PromptService::create.promptZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => this.promptRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }

  getPrompt(id: string, options?: DbQueryOptions<IbmPrompt>): Effect.Effect<IbmPrompt | null, PromptServiceError> {
    return this.getById(id, options)
  }

  listPrompts(
    filter: Partial<IbmPrompt> = {},
    options?: DbQueryOptions<IbmPrompt>
  ): Effect.Effect<IbmPrompt[], PromptServiceError> {
    const stage = 'PromptService::listPrompts'
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((filter) => this.promptRepository.find({ matchEq: filter, options } as any).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in listPrompts')
      }))
    )
  }

  updatePrompt(id: string, patch: Partial<IbmPrompt>): Effect.Effect<IbmPrompt, PromptServiceError> {
    const stage = 'PromptService::updatePrompt'
    if (!patch || Object.keys(patch).length === 0) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'patch', stage }))
    }

    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((entityId) =>
        validateBmInputWithSchema({
          input: patch,
          schema: promptZodSchemaInsert.partial().strict(),
          stage,
          operation: 'PromptService::updatePrompt.promptZodSchemaInsert.patch',
          field: 'patch',
        }).pipe(
          Effect.map(() => entityId)
        )
      ),
      Effect.flatMap((promptId) =>
        this.promptRepository.patchById(promptId, patch).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in updatePrompt')
      }))
    )
  }

  removePrompt(id: string): Effect.Effect<void, PromptServiceError> {
    const stage = 'PromptService::removePrompt'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((promptId) =>
        this.promptRepository.deleteById(promptId).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'deleteById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.map(() => undefined)
    )
  }
}
