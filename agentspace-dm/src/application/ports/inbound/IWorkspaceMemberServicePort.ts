import { Effect } from 'effect'
import { WorkspaceMemberServiceError } from '../../errors/WorkspaceMemberServiceError.js'
import { IbmWorkspaceMember, IbmWorkspaceMemberInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export interface IWorkspaceMemberServicePort {
  getById(id: string, options?: DbQueryOptions<IbmWorkspaceMember>): Effect.Effect<IbmWorkspaceMember | null, WorkspaceMemberServiceError>
  create(data: IbmWorkspaceMemberInsert): Effect.Effect<IbmWorkspaceMember, WorkspaceMemberServiceError>
  listWorkspaceMembers(
    filter?: Partial<IbmWorkspaceMember>,
    options?: DbQueryOptions<IbmWorkspaceMember>
  ): Effect.Effect<IbmWorkspaceMember[], WorkspaceMemberServiceError>
  updateWorkspaceMember(id: string, patch: Partial<IbmWorkspaceMember>): Effect.Effect<IbmWorkspaceMember, WorkspaceMemberServiceError>
  removeWorkspaceMember(id: string): Effect.Effect<void, WorkspaceMemberServiceError>
}

export interface IWorkspaceMemberLookupPort {
  getById(id: string): Effect.Effect<IbmWorkspaceMember | null, WorkspaceMemberServiceError>
}
