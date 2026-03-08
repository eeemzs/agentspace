import { Effect } from 'effect'
import { ResourceServiceError } from '../../errors/ResourceServiceError.js'
import { IbmResource, IbmResourceInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export interface IResourceServicePort {
  getById(id: string, options?: DbQueryOptions<IbmResource>): Effect.Effect<IbmResource | null, ResourceServiceError>
  create(data: IbmResourceInsert): Effect.Effect<IbmResource, ResourceServiceError>
  getResource(id: string, options?: DbQueryOptions<IbmResource>): Effect.Effect<IbmResource | null, ResourceServiceError>
  createResource(data: IbmResourceInsert): Effect.Effect<IbmResource, ResourceServiceError>
  updateResource(id: string, patch: Partial<IbmResource>): Effect.Effect<IbmResource, ResourceServiceError>
  listResources(filter?: Partial<IbmResource>, options?: DbQueryOptions<IbmResource>): Effect.Effect<IbmResource[], ResourceServiceError>
  removeResource(id: string): Effect.Effect<void, ResourceServiceError>
}

export interface IResourceLookupPort {
  getById(id: string): Effect.Effect<IbmResource | null, ResourceServiceError>
}
