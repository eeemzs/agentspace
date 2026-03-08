import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortMemoryItem } from '../ports/repository-ports/index.js'
import type { IMemoryItemServicePort } from '../ports/inbound/index.js'
import { MemoryItemServiceError } from '../errors/MemoryItemServiceError.js'
import { IbmMemoryItem, IbmMemoryItemInsert, memoryItemZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

export interface MemoryItemServiceDependencies {}

export interface MemoryItemServiceOptions {
  memoryItemRepository: IRepositoryPortMemoryItem
  serviceDependencies?: Partial<MemoryItemServiceDependencies>
  logger?: XfLogger
  locale?: string
}

export class MemoryItemService implements IMemoryItemServicePort {
  private readonly memoryItemRepository: IRepositoryPortMemoryItem
  private readonly logger?: XfLogger

  constructor(options: MemoryItemServiceOptions) {
    this.memoryItemRepository = options.memoryItemRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmMemoryItem>): Effect.Effect<IbmMemoryItem | null, MemoryItemServiceError> {
    const stage = 'MemoryItemService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.memoryItemRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmMemoryItemInsert): Effect.Effect<IbmMemoryItem, MemoryItemServiceError> {
    const stage = 'MemoryItemService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: memoryItemZodSchemaInsert,
          stage,
          operation: 'MemoryItemService::create.memoryItemZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => this.memoryItemRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }

  addMemoryItem(data: IbmMemoryItemInsert): Effect.Effect<IbmMemoryItem, MemoryItemServiceError> {
    const stage = 'MemoryItemService::addMemoryItem'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: memoryItemZodSchemaInsert,
          stage,
          operation: 'MemoryItemService::addMemoryItem.memoryItemZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((payload) => this.create(payload)),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in addMemoryItem')
      }))
    )
  }

  updateMemoryItem(id: string, patch: Partial<IbmMemoryItem>): Effect.Effect<IbmMemoryItem, MemoryItemServiceError> {
    const stage = 'MemoryItemService::updateMemoryItem'
    if (!patch || Object.keys(patch).length === 0) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'patch', stage }))
    }
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((entityId) =>
        validateBmInputWithSchema({
          input: patch,
          schema: memoryItemZodSchemaInsert.partial().strict(),
          stage,
          operation: 'MemoryItemService::updateMemoryItem.memoryItemZodSchemaInsert.patch',
          field: 'patch',
        }).pipe(
          Effect.map(() => entityId)
        )
      ),
      Effect.flatMap((itemId) =>
        this.memoryItemRepository.patchById(itemId, patch).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in updateMemoryItem')
      }))
    )
  }

  setMemoryImportance(id: string, importance: number | null): Effect.Effect<IbmMemoryItem, MemoryItemServiceError> {
    const stage = 'MemoryItemService::setMemoryImportance'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap(() => this.updateMemoryItem(id, { importance: importance === null ? (null as any) : importance }))
    )
  }

  listMemoryItems(
    filter: Partial<IbmMemoryItem> = {},
    options?: DbQueryOptions<IbmMemoryItem>
  ): Effect.Effect<IbmMemoryItem[], MemoryItemServiceError> {
    const stage = 'MemoryItemService::listMemoryItems'
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((filter) => this.memoryItemRepository.find({ matchEq: filter, options } as any).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in listMemoryItems')
      }))
    )
  }

  searchMemoryItems(
    filter: Partial<IbmMemoryItem> = {},
    options?: DbQueryOptions<IbmMemoryItem>
  ): Effect.Effect<IbmMemoryItem[], MemoryItemServiceError> {
    const stage = 'MemoryItemService::searchMemoryItems'
    return pipe(
      this.listMemoryItems(filter, options),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in searchMemoryItems')
      }))
    )
  }

  removeMemoryItem(id: string): Effect.Effect<void, MemoryItemServiceError> {
    const stage = 'MemoryItemService::removeMemoryItem'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((itemId) =>
        this.memoryItemRepository.deleteById(itemId).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'deleteById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.map(() => undefined)
    )
  }
}
