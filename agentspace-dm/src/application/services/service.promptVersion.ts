import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, XfMessageType, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortPromptVersion } from '../ports/repository-ports/index.js'
import type { IPromptVersionServicePort, IPromptServicePort } from '../ports/inbound/index.js'
import { PromptVersionServiceError } from '../errors/PromptVersionServiceError.js'
import { IbmPrompt, IbmPromptVersion, IbmPromptVersionInsert, promptVersionZodSchemaInsert } from '../../domain/models/index.js'
import type { PromptStatus } from '../../domain/types.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

function normalizeNonEmpty(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizePositiveInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined
  return parsed
}

function normalizePromptStatusFromVersionStatus(value: unknown): PromptStatus | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === 'draft') return 'draft'
  if (normalized === 'published') return 'published'
  if (normalized === 'archived') return 'archived'
  return undefined
}

function createValidationError(
  messageText: string,
  stage: string,
  data?: unknown
): PromptVersionServiceError {
  return XfErrorFactory.xfValidationFailed(
    {
      ok: false,
      messages: [
        {
          messageType: XfMessageType.ValidationErr,
          messageText,
          stage,
          ts: new Date(),
        },
      ],
      data,
    },
    { stage, message: messageText, code: 'validation_error' },
    data
  )
}

export interface PromptVersionServiceDependencies {}

export interface PromptVersionServiceOptions {
  promptVersionRepository: IRepositoryPortPromptVersion
  promptService: IPromptServicePort
  serviceDependencies?: Partial<PromptVersionServiceDependencies>
  logger?: XfLogger
  locale?: string
}

export class PromptVersionService implements IPromptVersionServicePort {
  private readonly promptVersionRepository: IRepositoryPortPromptVersion
  private readonly promptService: IPromptServicePort
  private readonly logger?: XfLogger

  constructor(options: PromptVersionServiceOptions) {
    this.promptVersionRepository = options.promptVersionRepository
    this.promptService = options.promptService
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  private syncPromptLatestVersion(
    promptId: string,
    updatedBy?: string
  ): Effect.Effect<string | null, PromptVersionServiceError> {
    const stage = 'PromptVersionService::syncPromptLatestVersion'
    return pipe(
      this.promptVersionRepository.find({
        matchEq: { promptId },
        options: { sort: [{ field: 'version', type: 'desc' }], limit: 1 } as any,
      } as any),
      Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound })),
      Effect.flatMap((versions) => {
        const nextId = versions?.[0]?.id ?? null
        const patch: Partial<IbmPrompt> = {
          currentVersionId: nextId,
        }
        if (updatedBy !== undefined) {
          patch.updatedBy = updatedBy
        }
        return this.promptService.updatePrompt(promptId, patch).pipe(
          Effect.mapError((cause) =>
            XfErrorFactory.upsertFailed({ stage, operation: 'promptService.updatePrompt', cause })
          ),
          Effect.as(nextId)
        )
      })
    )
  }

  private syncPromptStatus(
    promptId: string,
    status: PromptStatus,
    updatedBy?: string
  ): Effect.Effect<void, PromptVersionServiceError> {
    const stage = 'PromptVersionService::syncPromptStatus'
    const patch: Partial<IbmPrompt> = { status }
    if (updatedBy !== undefined) {
      patch.updatedBy = updatedBy
    }
    return this.promptService.updatePrompt(promptId, patch).pipe(
      Effect.mapError((cause) =>
        XfErrorFactory.upsertFailed({ stage, operation: 'promptService.updatePrompt', cause })
      ),
      Effect.as(undefined)
    )
  }

  getById(id: string, options?: DbQueryOptions<IbmPromptVersion>): Effect.Effect<IbmPromptVersion | null, PromptVersionServiceError> {
    const stage = 'PromptVersionService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.promptVersionRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  private resolveCreateData(
    data: IbmPromptVersionInsert
  ): Effect.Effect<IbmPromptVersionInsert, PromptVersionServiceError> {
    const stage = 'PromptVersionService::resolveCreateData'
    const promptId = normalizeNonEmpty(data?.promptId)
    if (!promptId) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'promptId', stage })).pipe(
        Effect.mapError((cause): PromptVersionServiceError => cause)
      )
    }

    return pipe(
      this.promptService.getById(promptId).pipe(
        Effect.mapError((cause) =>
          XfErrorFactory.createFailed({ stage, operation: 'promptService.getById', cause })
        )
      ),
      Effect.flatMap((prompt) =>
        prompt
          ? Effect.succeed(prompt)
          : Effect.fail(XfErrorFactory.notFound({ stage, identifier: promptId }))
      ),
      Effect.flatMap((prompt): Effect.Effect<IbmPromptVersionInsert, PromptVersionServiceError> => {
        const dataWorkspaceId = normalizeNonEmpty(data?.workspaceId)
        const promptWorkspaceId = normalizeNonEmpty(prompt.workspaceId)
        if (dataWorkspaceId && promptWorkspaceId && dataWorkspaceId !== promptWorkspaceId) {
          return Effect.fail(
            createValidationError('workspaceId must match the prompt workspaceId.', stage, {
              promptId,
              workspaceId: dataWorkspaceId,
              promptWorkspaceId,
            })
          )
        }

        const workspaceId = dataWorkspaceId ?? promptWorkspaceId
        if (!workspaceId) {
          return Effect.fail(XfErrorFactory.inputRequired({ field: 'workspaceId', stage })).pipe(
            Effect.mapError((cause): PromptVersionServiceError => cause)
          )
        }

        const explicitVersion = normalizePositiveInteger(data?.version)
        if (explicitVersion !== undefined) {
          return Effect.succeed({
            ...data,
            promptId,
            workspaceId,
            version: explicitVersion,
          } as IbmPromptVersionInsert)
        }

        return this.promptVersionRepository.find({
          matchEq: { promptId },
          options: { sort: [{ field: 'version', type: 'desc' }], limit: 1 } as any,
        } as any).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.createFailed })),
          Effect.map((versions) => ({
            ...data,
            promptId,
            workspaceId,
            version: Number(versions?.[0]?.version ?? 0) + 1,
          } as IbmPromptVersionInsert)),
          Effect.mapError((cause): PromptVersionServiceError => cause)
        )
      }),
      Effect.mapError((cause): PromptVersionServiceError => cause)
    )
  }

  create(data: IbmPromptVersionInsert): Effect.Effect<IbmPromptVersion, PromptVersionServiceError> {
    const stage = 'PromptVersionService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        this.resolveCreateData(data).pipe(
          Effect.flatMap((resolvedData) =>
            validateBmInputWithSchema({
              input: resolvedData,
              schema: promptVersionZodSchemaInsert,
              stage,
              operation: 'PromptVersionService::create.promptVersionZodSchemaInsert',
              field: 'data',
            })
          ),
          Effect.flatMap((resolvedData) => {
            const normalized =
              resolvedData.status === 'published' && !resolvedData.publishedAt
                ? ({ ...resolvedData, publishedAt: new Date() } as IbmPromptVersionInsert)
                : resolvedData

            return this.promptVersionRepository.create(normalized).pipe(
              Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed })),
              Effect.flatMap((created) => {
                if (created?.promptId) {
                  return this.syncPromptLatestVersion(created.promptId, created.updatedBy).pipe(
                    Effect.flatMap(() => {
                      if (created.status !== 'published') return Effect.succeed(undefined)
                      return this.syncPromptStatus(created.promptId, 'published', created.updatedBy)
                    }),
                    Effect.as(created)
                  )
                }
                return Effect.succeed(created)
              })
            )
          })
        )
      )
    )
  }

  getPromptVersion(id: string, options?: DbQueryOptions<IbmPromptVersion>): Effect.Effect<IbmPromptVersion | null, PromptVersionServiceError> {
    return this.getById(id, options)
  }

  listPromptVersions(
    filter: Partial<IbmPromptVersion> = {},
    options?: DbQueryOptions<IbmPromptVersion>
  ): Effect.Effect<IbmPromptVersion[], PromptVersionServiceError> {
    const stage = 'PromptVersionService::listPromptVersions'
    return pipe(
      validateInput(filter, 'filter', { stage }),
      Effect.flatMap((filter) =>
        this.promptVersionRepository.find({ matchEq: filter, options } as any).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'find', factory: XfErrorFactory.notFound }))
        )
      ),
      Effect.tapError((e) =>
        Effect.sync(() => {
          const info = effectErrorInfo(e)
          this.logger?.error({ error: info.unwrapped, stage }, 'Error in listPromptVersions')
        })
      )
    )
  }

  updatePromptVersion(id: string, patch: Partial<IbmPromptVersion>): Effect.Effect<IbmPromptVersion, PromptVersionServiceError> {
    const stage = 'PromptVersionService::updatePromptVersion'
    if (!patch || Object.keys(patch).length === 0) {
      return Effect.fail(XfErrorFactory.inputRequired({ field: 'patch', stage }))
    }
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((entityId) =>
        validateBmInputWithSchema({
          input: patch,
          schema: promptVersionZodSchemaInsert.partial().strict(),
          stage,
          operation: 'PromptVersionService::updatePromptVersion.promptVersionZodSchemaInsert.patch',
          field: 'patch',
        }).pipe(
          Effect.map(() => entityId)
        )
      ),
      Effect.flatMap((versionId) =>
        this.getById(versionId).pipe(
          Effect.flatMap((current) =>
            current
              ? Effect.succeed(current)
              : Effect.fail(XfErrorFactory.notFound({ stage, identifier: versionId }))
          ),
          Effect.flatMap((current) => {
            const normalizedPatch: Partial<IbmPromptVersion> = { ...patch }
            if (normalizedPatch.status === 'published' && !normalizedPatch.publishedAt) {
              normalizedPatch.publishedAt = new Date()
            }
            const promptStatusFromPatch = normalizePromptStatusFromVersionStatus(normalizedPatch.status)
            const shouldSyncLatestVersion = normalizedPatch.version !== undefined
            return this.promptVersionRepository.patchById(versionId, normalizedPatch).pipe(
              Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed })),
              Effect.flatMap((updated) => {
                if (!current.promptId) {
                  return Effect.succeed(updated)
                }

                let syncEffect: Effect.Effect<void, PromptVersionServiceError> = Effect.succeed(undefined)

                if (shouldSyncLatestVersion) {
                  syncEffect = pipe(
                    syncEffect,
                    Effect.flatMap(() =>
                      this.syncPromptLatestVersion(current.promptId as string, normalizedPatch.updatedBy).pipe(
                        Effect.as(undefined)
                      )
                    )
                  )
                }

                if (promptStatusFromPatch) {
                  syncEffect = pipe(
                    syncEffect,
                    Effect.flatMap(() =>
                      this.syncPromptStatus(
                        current.promptId as string,
                        promptStatusFromPatch,
                        normalizedPatch.updatedBy
                      )
                    )
                  )
                }

                return syncEffect.pipe(Effect.as(updated))
              })
            )
          })
        )
      ),
      Effect.tapError((e) =>
        Effect.sync(() => {
          const info = effectErrorInfo(e)
          this.logger?.error({ error: info.unwrapped, stage }, 'Error in updatePromptVersion')
        })
      )
    )
  }

  removePromptVersion(id: string): Effect.Effect<void, PromptVersionServiceError> {
    const stage = 'PromptVersionService::removePromptVersion'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((versionId) =>
        this.getById(versionId).pipe(
          Effect.flatMap((current) =>
            current
              ? Effect.succeed(current)
              : Effect.fail(XfErrorFactory.notFound({ stage, identifier: versionId }))
          ),
          Effect.flatMap((current) =>
            this.promptVersionRepository.deleteById(versionId).pipe(
              Effect.mapError(mapDbError({ stage, operation: 'deleteById', factory: XfErrorFactory.upsertFailed })),
              Effect.flatMap(() => {
                if (!current.promptId) {
                  return Effect.succeed(undefined)
                }

                return this.syncPromptLatestVersion(current.promptId, current.updatedBy).pipe(
                  Effect.flatMap((nextId) => {
                    if (nextId !== null) return Effect.succeed(undefined)
                    return this.syncPromptStatus(current.promptId as string, 'draft', current.updatedBy)
                  }),
                  Effect.as(undefined)
                )
              })
            )
          )
        )
      ),
      Effect.map(() => undefined)
    )
  }

  publishPromptVersion(
    id: string,
    publishedAt?: Date,
    updatedBy?: string
  ): Effect.Effect<IbmPromptVersion, PromptVersionServiceError> {
    const stage = 'PromptVersionService::publishPromptVersion'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap(() =>
        this.getById(id).pipe(
          Effect.flatMap((version) =>
            version
              ? Effect.succeed(version)
              : Effect.fail(XfErrorFactory.notFound({ stage, identifier: id }))
          )
        )
      ),
      Effect.flatMap((version) => {
        const resolvedPublishedAt = publishedAt ?? version.publishedAt ?? new Date()
        const patch: Partial<IbmPromptVersion> = {
          status: 'published',
          publishedAt: resolvedPublishedAt,
        }
        if (updatedBy !== undefined) {
          patch.updatedBy = updatedBy
        }
        return this.promptVersionRepository.patchById(id, patch).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'patchById', factory: XfErrorFactory.upsertFailed })),
          Effect.flatMap((updated) => {
            if (!version.promptId) return Effect.succeed(updated)
            return this.syncPromptLatestVersion(version.promptId, updatedBy).pipe(
              Effect.flatMap(() => this.syncPromptStatus(version.promptId as string, 'published', updatedBy)),
              Effect.as(updated)
            )
          })
        )
      }),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in publishPromptVersion')
      }))
    )
  }
}
