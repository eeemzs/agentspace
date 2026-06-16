import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortMission, IRepositoryPortScope } from '../ports/repository-ports/index.js'
import type {
  IMissionServicePort,
  MissionCreateInput,
  MissionListFilter,
  MissionResumePack,
  MissionResumePackOptions,
} from '../ports/inbound/index.js'
import { MissionServiceError } from '../errors/MissionServiceError.js'
import { IbmMission, IbmMissionInsert, missionZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'
import { listRecordsByScopeResolution } from './service.scope-resolution.js'

export interface MissionServiceDependencies {}

export interface MissionServiceOptions {
  missionRepository: IRepositoryPortMission
  scopeRepository?: IRepositoryPortScope
  serviceDependencies?: Partial<MissionServiceDependencies>
  logger?: XfLogger
  locale?: string
}

function toMissionRefs(mission: IbmMission): unknown[] {
  return [
    ...(Array.isArray(mission.references) ? mission.references : []),
    mission.visionDocRef,
    mission.activeImplementationPlanRef,
    mission.sourceTemplateRef,
  ].filter(Boolean)
}

function extractPlanSprintId(ref: unknown): string | undefined {
  if (!ref || typeof ref !== 'object' || Array.isArray(ref)) return undefined
  const record = ref as { refType?: unknown; refId?: unknown }
  if (record.refType === 'projectman.sprint' && typeof record.refId === 'string') return record.refId
  return undefined
}

export class MissionService implements IMissionServicePort {
  private readonly missionRepository: IRepositoryPortMission
  private readonly scopeRepository?: IRepositoryPortScope
  private readonly logger?: XfLogger

  constructor(options: MissionServiceOptions) {
    this.missionRepository = options.missionRepository
    this.scopeRepository = options.scopeRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmMission>): Effect.Effect<IbmMission | null, MissionServiceError> {
    const stage = 'MissionService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.missionRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmMissionInsert): Effect.Effect<IbmMission, MissionServiceError> {
    const stage = 'MissionService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.map((payload) => ({
        ...payload,
        status: payload.status ?? 'draft',
      })),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: missionZodSchemaInsert,
          stage,
          operation: 'MissionService::create.missionZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => this.missionRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }

  createMission(data: MissionCreateInput): Effect.Effect<IbmMission, MissionServiceError> {
    const stage = 'MissionService::createMission'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.map((payload) => ({
        ...payload,
        status: payload.status ?? 'draft',
      })),
      Effect.flatMap((payload) => this.create(payload as IbmMissionInsert)),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in createMission')
      }))
    )
  }

  updateMission(id: string, patch: Partial<IbmMissionInsert>): Effect.Effect<IbmMission, MissionServiceError> {
    const stage = 'MissionService::updateMission'
    if (!patch || Object.keys(patch).length === 0) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'patch', stage }))
    }

    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((entityId) =>
        validateBmInputWithSchema({
          input: patch,
          schema: missionZodSchemaInsert.partial().strict(),
          stage,
          operation: 'MissionService::updateMission.missionZodSchemaInsert.patch',
          field: 'patch',
        }).pipe(
          Effect.map(() => entityId)
        )
      ),
      Effect.flatMap((missionId) =>
        this.missionRepository.patchById(missionId, patch as Partial<IbmMission>).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in updateMission')
      }))
    )
  }

  listMissions(
    filter: MissionListFilter = {},
    options?: DbQueryOptions<IbmMission>
  ): Effect.Effect<IbmMission[], MissionServiceError> {
    const stage = 'MissionService::listMissions'
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((value) => listRecordsByScopeResolution(this.missionRepository as any, this.scopeRepository, value, options, {
        stage,
        defaultResolution: 'explicit',
      }).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        if ((info.unwrapped as { _tag?: string } | undefined)?._tag === 'NotFoundError') return
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in listMissions')
      }))
    )
  }

  buildResumePack(id: string, _options: MissionResumePackOptions = {}): Effect.Effect<MissionResumePack, MissionServiceError> {
    const stage = 'MissionService::buildResumePack'
    return pipe(
      this.getById(id),
      Effect.flatMap((mission) => {
        if (!mission) {
          return Effect.fail(XfErrorFactory.notFound({ identifier: id, stage }))
        }
        const activePlanRef = mission.activeImplementationPlanRef
        return Effect.succeed({
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          mission: {
            id: mission.id ?? id,
            slug: mission.slug,
            objective: mission.objective,
            status: mission.status,
            policy: mission.policy,
            refs: toMissionRefs(mission),
          },
          activePlan: {
            ref: activePlanRef,
            sprintId: extractPlanSprintId(activePlanRef),
            currentSlice: {},
            nextSlice: {},
            progress: {},
          },
          memory: [],
          reviews: [],
          issues: [],
          chat: {
            unread: 0,
            lastN: [],
          },
        } satisfies MissionResumePack)
      }),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in buildResumePack')
      }))
    )
  }
}
