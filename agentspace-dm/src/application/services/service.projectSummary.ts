import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortProjectSummary } from '../ports/repository-ports/index.js'
import type { IProjectSummaryServicePort, ProjectSummaryUpsertInput } from '../ports/inbound/index.js'
import { ProjectSummaryServiceError } from '../errors/ProjectSummaryServiceError.js'
import { IbmProjectSummary, IbmProjectSummaryInsert, projectSummaryZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

export interface ProjectSummaryServiceDependencies {}

export interface ProjectSummaryServiceOptions {
  projectSummaryRepository: IRepositoryPortProjectSummary
  serviceDependencies?: Partial<ProjectSummaryServiceDependencies>
  logger?: XfLogger
  locale?: string
}

export class ProjectSummaryService implements IProjectSummaryServicePort {
  private readonly projectSummaryRepository: IRepositoryPortProjectSummary
  private readonly logger?: XfLogger

  constructor(options: ProjectSummaryServiceOptions) {
    this.projectSummaryRepository = options.projectSummaryRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmProjectSummary>): Effect.Effect<IbmProjectSummary | null, ProjectSummaryServiceError> {
    const stage = 'ProjectSummaryService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.projectSummaryRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmProjectSummaryInsert): Effect.Effect<IbmProjectSummary, ProjectSummaryServiceError> {
    const stage = 'ProjectSummaryService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: projectSummaryZodSchemaInsert,
          stage,
          operation: 'ProjectSummaryService::create.projectSummaryZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => this.projectSummaryRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }

  getProjectSummary(projectId: string): Effect.Effect<IbmProjectSummary | null, ProjectSummaryServiceError> {
    const stage = 'ProjectSummaryService::getProjectSummary'
    return pipe(
      validateInput(projectId, 'projectId', { stage }),
      Effect.flatMap((projectId) =>
        this.projectSummaryRepository.find({ matchEq: { projectId }, options: { limit: 1 } } as any).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
        )
      ),
      Effect.map((items) => items?.[0] ?? null),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getProjectSummary')
      }))
    )
  }

  upsertProjectSummary(data: ProjectSummaryUpsertInput): Effect.Effect<IbmProjectSummary, ProjectSummaryServiceError> {
    const stage = 'ProjectSummaryService::upsertProjectSummary'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((payload) =>
        this.getProjectSummary(payload.projectId).pipe(Effect.map((existing) => ({ payload, existing })))
      ),
      Effect.flatMap(({ payload, existing }) => {
        const patch = Object.fromEntries(Object.entries({
          summary: payload.summary,
          decisions: payload.decisions,
          openItems: payload.openItems,
          lastRunId: payload.lastRunId,
          lastSessionId: payload.lastSessionId,
        }).filter(([, value]) => value !== undefined))

        if (existing?.id) {
          if (Object.keys(patch).length === 0) return Effect.succeed(existing)
          return this.projectSummaryRepository.patchById(existing.id, patch as any).pipe(
            Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
          )
        }

        return this.create({ projectId: payload.projectId, ...patch } as IbmProjectSummaryInsert)
      }),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in upsertProjectSummary')
      }))
    )
  }

  appendDecision(projectId: string, decision: unknown, lastRunId?: string, lastSessionId?: string): Effect.Effect<IbmProjectSummary, ProjectSummaryServiceError> {
    const stage = 'ProjectSummaryService::appendDecision'
    return pipe(
      validateInput(projectId, 'projectId', { stage }),
      Effect.flatMap(() =>
        this.getProjectSummary(projectId).pipe(Effect.map((existing) => ({ existing })))
      ),
      Effect.flatMap(({ existing }): Effect.Effect<IbmProjectSummary, ProjectSummaryServiceError> => {
        if (!existing?.id) {
          return Effect.fail(XfErrorFactory.notFound({ stage, identifier: projectId }))
        }
        const previous = existing?.decisions
        const decisions = Array.isArray(previous) ? [...previous, decision] : previous !== undefined ? [previous, decision] : [decision]
        const patch: Partial<IbmProjectSummary> = {
          decisions,
          lastRunId,
          lastSessionId,
        }

        return this.projectSummaryRepository.patchById(existing.id, patch).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
        )
      }),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in appendDecision')
      }))
    )
  }

  setOpenItems(projectId: string, openItems: unknown, lastRunId?: string, lastSessionId?: string): Effect.Effect<IbmProjectSummary, ProjectSummaryServiceError> {
    const stage = 'ProjectSummaryService::setOpenItems'
    return pipe(
      validateInput(projectId, 'projectId', { stage }),
      Effect.flatMap(() =>
        this.getProjectSummary(projectId).pipe(Effect.map((existing) => ({ existing })))
      ),
      Effect.flatMap(({ existing }): Effect.Effect<IbmProjectSummary, ProjectSummaryServiceError> => {
        if (!existing?.id) {
          return Effect.fail(XfErrorFactory.notFound({ stage, identifier: projectId }))
        }
        const patch: Partial<IbmProjectSummary> = {
          openItems,
          lastRunId,
          lastSessionId,
        }

        return this.projectSummaryRepository.patchById(existing.id, patch).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed }))
        )
      }),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in setOpenItems')
      }))
    )
  }
}
