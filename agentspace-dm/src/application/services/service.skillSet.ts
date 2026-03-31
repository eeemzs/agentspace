import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortScope, IRepositoryPortSkillSet } from '../ports/repository-ports/index.js'
import type { ISkillSetServicePort, ISkillSetItemServicePort, SkillSetItemCreateInput, SkillSetListFilter } from '../ports/inbound/index.js'
import { SkillSetServiceError } from '../errors/SkillSetServiceError.js'
import { IbmSkillSet, IbmSkillSetInsert, IbmSkillSetItem, skillSetZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'
import { listRecordsByScopeResolution } from './service.scope-resolution.js'

export interface SkillSetServiceOptions {
  skillSetRepository: IRepositoryPortSkillSet
  skillSetItemService: ISkillSetItemServicePort
  scopeRepository?: IRepositoryPortScope
  logger?: XfLogger
  locale?: string
}

export class SkillSetService implements ISkillSetServicePort {
  private readonly skillSetRepository: IRepositoryPortSkillSet
  private readonly skillSetItemService: ISkillSetItemServicePort
  private readonly scopeRepository?: IRepositoryPortScope
  private readonly logger?: XfLogger

  constructor(options: SkillSetServiceOptions) {
    this.skillSetRepository = options.skillSetRepository
    this.skillSetItemService = options.skillSetItemService
    this.scopeRepository = options.scopeRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmSkillSet>): Effect.Effect<IbmSkillSet | null, SkillSetServiceError> {
    const stage = 'SkillSetService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.skillSetRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmSkillSetInsert): Effect.Effect<IbmSkillSet, SkillSetServiceError> {
    const stage = 'SkillSetService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: skillSetZodSchemaInsert,
          stage,
          operation: 'SkillSetService::create.skillSetZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => this.skillSetRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }

  listSkillSets(
    filter: SkillSetListFilter = {},
    options?: DbQueryOptions<IbmSkillSet>
  ): Effect.Effect<IbmSkillSet[], SkillSetServiceError> {
    const stage = 'SkillSetService::listSkillSets'
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((value) => listRecordsByScopeResolution(this.skillSetRepository as any, this.scopeRepository, value, options, {
        stage,
        defaultResolution: 'cascade',
        dedupeKey: (item) => String(item?.name ?? '').trim().toLowerCase() || undefined,
      }).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in listSkillSets')
      }))
    )
  }

  updateSkillSet(id: string, patch: Partial<IbmSkillSet>): Effect.Effect<IbmSkillSet, SkillSetServiceError> {
    const stage = 'SkillSetService::updateSkillSet'
    if (!patch || Object.keys(patch).length === 0) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'patch', stage }))
    }
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((entityId) =>
        validateBmInputWithSchema({
          input: patch,
          schema: skillSetZodSchemaInsert.partial().strict(),
          stage,
          operation: 'SkillSetService::updateSkillSet.skillSetZodSchemaInsert.patch',
          field: 'patch',
        }).pipe(
          Effect.map(() => entityId)
        )
      ),
      Effect.flatMap((skillSetId) => this.skillSetRepository.patchById(skillSetId, patch).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in updateSkillSet')
      }))
    )
  }

  addSkillVersionToSkillSet(data: SkillSetItemCreateInput): Effect.Effect<IbmSkillSetItem, SkillSetServiceError> {
    const stage = 'SkillSetService::addSkillVersionToSkillSet'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((payload) =>
        this.skillSetItemService.addSkillSetItem(payload).pipe(
          Effect.mapError((cause) => XfErrorFactory.createFailed({ stage, operation: 'skillSetItemService.addSkillSetItem', cause }))
        )
      )
    )
  }

  removeSkillVersionFromSkillSet(
    skillSetId: string,
    skillVersionId: string
  ): Effect.Effect<IbmSkillSetItem, SkillSetServiceError> {
    const stage = 'SkillSetService::removeSkillVersionFromSkillSet'
    return pipe(
      validateInput(skillSetId, 'skillSetId', { stage }),
      Effect.flatMap(() => validateInput(skillVersionId, 'skillVersionId', { stage })),
      Effect.flatMap(() =>
        this.skillSetItemService.listSkillSetItems({ skillSetId, skillVersionId }, { limit: 1 }).pipe(
          Effect.mapError((cause) => XfErrorFactory.notFound({ stage, operation: 'skillSetItemService.listSkillSetItems', cause }))
        )
      ),
      Effect.flatMap((items): Effect.Effect<IbmSkillSetItem, SkillSetServiceError> => {
        const item = items?.[0]
        if (!item?.id) {
          return Effect.fail(XfErrorFactory.notFound({ stage, identifier: `${skillSetId}:${skillVersionId}` }))
        }
        return this.skillSetItemService.removeSkillSetItem(item.id).pipe(
          Effect.mapError((cause) => XfErrorFactory.upsertFailed({ stage, operation: 'skillSetItemService.removeSkillSetItem', cause })),
          Effect.as(item)
        )
      }),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in removeSkillVersionFromSkillSet')
      }))
    )
  }

  reorderSkillSetItems(skillSetId: string, orderedItemIds: string[]): Effect.Effect<number, SkillSetServiceError> {
    const stage = 'SkillSetService::reorderSkillSetItems'
    return pipe(
      validateInput(skillSetId, 'skillSetId', { stage }),
      Effect.flatMap(() =>
        this.skillSetItemService.reorderSkillSetItems(skillSetId, orderedItemIds).pipe(
          Effect.mapError((cause) => XfErrorFactory.upsertFailed({ stage, operation: 'skillSetItemService.reorderSkillSetItems', cause }))
        )
      )
    )
  }
}
