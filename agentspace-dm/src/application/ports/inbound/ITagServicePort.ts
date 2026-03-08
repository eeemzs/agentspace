import { Effect } from 'effect'
import { TagServiceError } from '../../errors/TagServiceError.js'
import { IbmTag, IbmTagInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'
import { TagScopeType } from '../../../domain/types.js'

export type TagEnsureInput = {
  workspaceId: string
  scopeType: TagScopeType
  tags: string[]
  createdBy?: string
  updatedBy?: string
}

export interface ITagServicePort {
  getById(id: string, options?: DbQueryOptions<IbmTag>): Effect.Effect<IbmTag | null, TagServiceError>
  create(data: IbmTagInsert): Effect.Effect<IbmTag, TagServiceError>
  ensureTags(input: TagEnsureInput): Effect.Effect<IbmTag[], TagServiceError>
  listTags(filter?: Partial<IbmTag>, options?: DbQueryOptions<IbmTag>): Effect.Effect<IbmTag[], TagServiceError>
  searchTags(filter: Partial<IbmTag>, query: string, options?: DbQueryOptions<IbmTag>): Effect.Effect<IbmTag[], TagServiceError>
  //==> custom-methods
  // getByDummyString(dummy: string): Effect.Effect<IbmTag | null, TagServiceError>
  //<==//
}

export interface ITagLookupPort {
  getById(id: string): Effect.Effect<IbmTag | null, TagServiceError>
}
