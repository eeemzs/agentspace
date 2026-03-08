import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortSkill } from '../ports/repository-ports/index.js'
import type { ISkillServicePort } from '../ports/inbound/index.js'
import { SkillServiceError } from '../errors/SkillServiceError.js'
import { IbmSkill, IbmSkillInsert, skillZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

export interface SkillServiceDependencies {}

export interface SkillServiceOptions {
  skillRepository: IRepositoryPortSkill
  serviceDependencies?: Partial<SkillServiceDependencies>
  logger?: XfLogger
  locale?: string
}

export class SkillService implements ISkillServicePort {
  private readonly skillRepository: IRepositoryPortSkill
  private readonly logger?: XfLogger

  constructor(options: SkillServiceOptions) {
    this.skillRepository = options.skillRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmSkill>): Effect.Effect<IbmSkill | null, SkillServiceError> {
    const stage = 'SkillService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.skillRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmSkillInsert): Effect.Effect<IbmSkill, SkillServiceError> {
    const stage = 'SkillService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: skillZodSchemaInsert,
          stage,
          operation: 'SkillService::create.skillZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => this.skillRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }

  getSkill(id: string, options?: DbQueryOptions<IbmSkill>): Effect.Effect<IbmSkill | null, SkillServiceError> {
    return this.getById(id, options)
  }

  listSkills(
    filter: Partial<IbmSkill> = {},
    options?: DbQueryOptions<IbmSkill>
  ): Effect.Effect<IbmSkill[], SkillServiceError> {
    const stage = 'SkillService::listSkills'
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((filter) => this.skillRepository.find({ matchEq: filter, options } as any).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in listSkills')
      }))
    )
  }

  updateSkill(id: string, patch: Partial<IbmSkill>): Effect.Effect<IbmSkill, SkillServiceError> {
    const stage = 'SkillService::updateSkill'
    if (!patch || Object.keys(patch).length === 0) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'patch', stage }))
    }

    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((entityId) =>
        validateBmInputWithSchema({
          input: patch,
          schema: skillZodSchemaInsert.partial().strict(),
          stage,
          operation: 'SkillService::updateSkill.skillZodSchemaInsert.patch',
          field: 'patch',
        }).pipe(
          Effect.map(() => entityId)
        )
      ),
      Effect.flatMap((skillId) =>
        this.skillRepository.patchById(skillId, patch).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in updateSkill')
      }))
    )
  }

  removeSkill(id: string): Effect.Effect<void, SkillServiceError> {
    const stage = 'SkillService::removeSkill'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((skillId) =>
        this.skillRepository.deleteById(skillId).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'deleteById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.map(() => undefined)
    )
  }
}
