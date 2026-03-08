import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortSkillSetItem } from '../ports/repository-ports/index.js'
import type { ISkillSetItemServicePort, SkillSetItemCreateInput } from '../ports/inbound/index.js'
import { SkillSetItemServiceError } from '../errors/SkillSetItemServiceError.js'
import { IbmSkillSetItem, IbmSkillSetItemInsert, skillSetItemZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

export interface SkillSetItemServiceDependencies {}

export interface SkillSetItemServiceOptions {
  skillSetItemRepository: IRepositoryPortSkillSetItem
  serviceDependencies?: Partial<SkillSetItemServiceDependencies>
  logger?: XfLogger
  locale?: string
}

export class SkillSetItemService implements ISkillSetItemServicePort {
  private readonly skillSetItemRepository: IRepositoryPortSkillSetItem
  private readonly logger?: XfLogger

  constructor(options: SkillSetItemServiceOptions) {
    this.skillSetItemRepository = options.skillSetItemRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmSkillSetItem>): Effect.Effect<IbmSkillSetItem | null, SkillSetItemServiceError> {
    const stage = 'SkillSetItemService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.skillSetItemRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmSkillSetItemInsert): Effect.Effect<IbmSkillSetItem, SkillSetItemServiceError> {
    const stage = 'SkillSetItemService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: skillSetItemZodSchemaInsert,
          stage,
          operation: 'SkillSetItemService::create.skillSetItemZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => {
        if (data.position === undefined || data.position === null) {
          return pipe(
            this.listSkillSetItems({ skillSetId: data.skillSetId }, { sort: [{ field: 'position', type: 'desc' }], limit: 1 }),
            Effect.map((items) => {
              const next = items?.[0]?.position ?? -1
              return { ...data, position: next + 1 }
            })
          )
        }
        return Effect.succeed(data)
      }),
      Effect.flatMap((data) => this.skillSetItemRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }

  addSkillSetItem(data: SkillSetItemCreateInput): Effect.Effect<IbmSkillSetItem, SkillSetItemServiceError> {
    const stage = 'SkillSetItemService::addSkillSetItem'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((payload) => this.create(payload as IbmSkillSetItemInsert))
    )
  }

  updateSkillSetItem(id: string, patch: Partial<IbmSkillSetItem>): Effect.Effect<IbmSkillSetItem, SkillSetItemServiceError> {
    const stage = 'SkillSetItemService::updateSkillSetItem'
    if (!patch || Object.keys(patch).length === 0) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'patch', stage }))
    }
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((entityId) =>
        validateBmInputWithSchema({
          input: patch,
          schema: skillSetItemZodSchemaInsert.partial().strict(),
          stage,
          operation: 'SkillSetItemService::updateSkillSetItem.skillSetItemZodSchemaInsert.patch',
          field: 'patch',
        }).pipe(
          Effect.map(() => entityId)
        )
      ),
      Effect.flatMap((itemId) =>
        this.skillSetItemRepository.patchById(itemId, patch).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in updateSkillSetItem')
      }))
    )
  }

  listSkillSetItems(
    filter: Partial<IbmSkillSetItem> = {},
    options?: DbQueryOptions<IbmSkillSetItem>
  ): Effect.Effect<IbmSkillSetItem[], SkillSetItemServiceError> {
    const stage = 'SkillSetItemService::listSkillSetItems'
    const queryOptions = options?.sort
      ? options
      : { ...options, sort: [{ field: 'position', type: 'asc' }] }
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((filter) => this.skillSetItemRepository.find({ matchEq: filter, options: queryOptions } as any).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in listSkillSetItems')
      }))
    )
  }

  reorderSkillSetItems(skillSetId: string, orderedItemIds: string[]): Effect.Effect<number, SkillSetItemServiceError> {
    const stage = 'SkillSetItemService::reorderSkillSetItems'
    const tempBase = 1000000
    return pipe(
      validateInput(skillSetId, 'skillSetId', { stage }),
      Effect.flatMap(() => validateInput(orderedItemIds, 'orderedItemIds', { stage })),
      Effect.flatMap(() =>
        Effect.forEach(
          orderedItemIds,
          (id, index) =>
            this.skillSetItemRepository.patchById(id, { position: tempBase + index } as any).pipe(
              Effect.mapError(mapDbError({ stage, operation: 'patchById(temp)', factory: XfErrorFactory.upsertFailed }))
            ),
          { concurrency: 1 }
        )
      ),
      Effect.flatMap(() =>
        Effect.forEach(
          orderedItemIds,
          (id, index) =>
            this.skillSetItemRepository.patchById(id, { position: index } as any).pipe(
              Effect.mapError(mapDbError({ stage, operation: 'patchById(final)', factory: XfErrorFactory.upsertFailed }))
            ),
          { concurrency: 1 }
        )
      ),
      Effect.map(() => orderedItemIds.length),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in reorderSkillSetItems')
      }))
    )
  }

  removeSkillSetItem(id: string): Effect.Effect<void, SkillSetItemServiceError> {
    const stage = 'SkillSetItemService::removeSkillSetItem'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((itemId) => this.skillSetItemRepository.deleteById(itemId).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'deleteById', factory: XfErrorFactory.upsertFailed }))
      )),
      Effect.map(() => undefined)
    )
  }
}
