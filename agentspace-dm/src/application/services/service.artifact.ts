import { Effect } from 'effect'
import { pipe } from 'effect/Function'
import { validateInput, XfErrorFactory, effectErrorInfo } from '@aopslab/xf-core'
import { XfLogger } from '@aopslab/xf-logger'
import type { IRepositoryPortArtifact, IRepositoryPortArtifactLink } from '../ports/repository-ports/index.js'
import type { ArtifactLinkInput, IArtifactServicePort } from '../ports/inbound/index.js'
import { ArtifactServiceError } from '../errors/ArtifactServiceError.js'
import { IbmArtifact, IbmArtifactInsert, IbmArtifactLink, artifactZodSchemaInsert } from '../../domain/models/index.js'
import { validateBmInputWithSchema } from './service.zod-validation.js'
import { DbQueryOptions, mapDbError } from '@aopslab/xf-db'

export interface ArtifactServiceDependencies {}

export interface ArtifactServiceOptions {
  artifactRepository: IRepositoryPortArtifact
  artifactLinkRepository?: IRepositoryPortArtifactLink
  serviceDependencies?: Partial<ArtifactServiceDependencies>
  logger?: XfLogger
  locale?: string
}

export class ArtifactService implements IArtifactServicePort {
  private readonly artifactRepository: IRepositoryPortArtifact
  private readonly artifactLinkRepository?: IRepositoryPortArtifactLink
  private readonly logger?: XfLogger

  constructor(options: ArtifactServiceOptions) {
    this.artifactRepository = options.artifactRepository
    this.artifactLinkRepository = options.artifactLinkRepository
    this.logger = options.logger?.child({ module: this.constructor.name })
  }

  getById(id: string, options?: DbQueryOptions<IbmArtifact>): Effect.Effect<IbmArtifact | null, ArtifactServiceError> {
    const stage = 'ArtifactService::getById'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((id) => this.artifactRepository.findById(id, options).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'findById', factory: XfErrorFactory.notFound }))
      )),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in getById')
      }))
    )
  }

  create(data: IbmArtifactInsert): Effect.Effect<IbmArtifact, ArtifactServiceError> {
    const stage = 'ArtifactService::create'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: artifactZodSchemaInsert,
          stage,
          operation: 'ArtifactService::create.artifactZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((data) => this.artifactRepository.create(data).pipe(
        Effect.mapError(mapDbError({ stage, operation: 'create', factory: XfErrorFactory.createFailed }))
      ))
    )
  }

  getArtifact(id: string, options?: DbQueryOptions<IbmArtifact>): Effect.Effect<IbmArtifact | null, ArtifactServiceError> {
    return this.getById(id, options)
  }

  storeArtifact(data: IbmArtifactInsert): Effect.Effect<IbmArtifact, ArtifactServiceError> {
    const stage = 'ArtifactService::storeArtifact'
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((data) =>
        validateBmInputWithSchema({
          input: data,
          schema: artifactZodSchemaInsert,
          stage,
          operation: 'ArtifactService::storeArtifact.artifactZodSchemaInsert',
          field: 'data',
        })
      ),
      Effect.flatMap((payload) => this.create(payload)),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in storeArtifact')
      }))
    )
  }

  linkArtifact(data: ArtifactLinkInput): Effect.Effect<IbmArtifactLink, ArtifactServiceError> {
    const stage = 'ArtifactService::linkArtifact'
    if (!this.artifactLinkRepository) {
      return Effect.fail(XfErrorFactory.configurationError({ stage, message: 'artifactLinkRepository is required' }))
    }
    return pipe(
      validateInput(data, 'data', { stage }),
      Effect.flatMap((payload) =>
        this.artifactLinkRepository!.create(payload as any).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'artifactLinkRepository.create', factory: XfErrorFactory.createFailed }))
        )
      ),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in linkArtifact')
      }))
    )
  }

  listArtifactsByRef(refType: IbmArtifactLink['refType'], refId: string, projectId?: string): Effect.Effect<IbmArtifact[], ArtifactServiceError> {
    const stage = 'ArtifactService::listArtifactsByRef'
    if (!this.artifactLinkRepository) {
      return Effect.fail(XfErrorFactory.configurationError({ stage, message: 'artifactLinkRepository is required' }))
    }
    return pipe(
      validateInput(refType, 'refType', { stage }),
      Effect.flatMap(() => validateInput(refId, 'refId', { stage })),
      Effect.flatMap(() => {
        const filter: Partial<IbmArtifactLink> = { refType, refId }
        if (projectId) {
          filter.projectId = projectId
        }
        return this.artifactLinkRepository!.find({ matchEq: filter } as any).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'artifactLinkRepository.find', factory: XfErrorFactory.notFound }))
        )
      }),
      Effect.flatMap((links) => {
        const ids = links.map((link) => link.artifactId).filter(Boolean) as string[]
        if (ids.length === 0) return Effect.succeed([])
        return Effect.forEach(
          ids,
          (id) =>
            this.artifactRepository.findById(id).pipe(
              Effect.catchAll((error) => {
                const code = (error as any)?.code
                if (code === 'NotFound' || code === 'DeleteRecordNotFound') {
                  return Effect.succeed(null)
                }
                return Effect.fail(error as any)
              })
            ),
          { concurrency: 1 }
        ).pipe(
          Effect.map((items) => items.filter((item): item is IbmArtifact => Boolean(item)))
        )
      }),
      Effect.tapError((e) => Effect.sync(() => {
        const info = effectErrorInfo(e)
        this.logger?.error({ error: info.unwrapped, stage }, 'Error in listArtifactsByRef')
      }))
    )
  }

  removeArtifact(id: string): Effect.Effect<void, ArtifactServiceError> {
    const stage = 'ArtifactService::removeArtifact'
    return pipe(
      validateInput(id, 'id', { stage }),
      Effect.flatMap((artifactId) =>
        this.artifactRepository.deleteById(artifactId).pipe(
          Effect.mapError(mapDbError({ stage, operation: 'deleteById', factory: XfErrorFactory.upsertFailed }))
        )
      ),
      Effect.map(() => undefined)
    )
  }
}
