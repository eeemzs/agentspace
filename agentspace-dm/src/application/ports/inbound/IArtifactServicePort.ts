import { Effect } from 'effect'
import { ArtifactServiceError } from '../../errors/ArtifactServiceError.js'
import { IbmArtifact, IbmArtifactInsert, IbmArtifactLink, IbmArtifactLinkInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export type ArtifactLinkInput = IbmArtifactLinkInsert

export interface IArtifactServicePort {
  getById(id: string, options?: DbQueryOptions<IbmArtifact>): Effect.Effect<IbmArtifact | null, ArtifactServiceError>
  create(data: IbmArtifactInsert): Effect.Effect<IbmArtifact, ArtifactServiceError>
  getArtifact(id: string, options?: DbQueryOptions<IbmArtifact>): Effect.Effect<IbmArtifact | null, ArtifactServiceError>
  storeArtifact(data: IbmArtifactInsert): Effect.Effect<IbmArtifact, ArtifactServiceError>
  linkArtifact(data: ArtifactLinkInput): Effect.Effect<IbmArtifactLink, ArtifactServiceError>
  listArtifactsByRef(refType: IbmArtifactLink['refType'], refId: string, projectId?: string): Effect.Effect<IbmArtifact[], ArtifactServiceError>
}

export interface IArtifactLookupPort {
  getById(id: string): Effect.Effect<IbmArtifact | null, ArtifactServiceError>
}
