import { Effect } from 'effect'
import { WorkspaceServiceError } from '../../errors/WorkspaceServiceError.js'
import { IbmWorkspace, IbmWorkspaceInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export interface IWorkspaceServicePort {
  getById(id: string, options?: DbQueryOptions<IbmWorkspace>): Effect.Effect<IbmWorkspace | null, WorkspaceServiceError>
  create(data: IbmWorkspaceInsert): Effect.Effect<IbmWorkspace, WorkspaceServiceError>
  listWorkspaces(
    filter?: Partial<IbmWorkspace>,
    options?: DbQueryOptions<IbmWorkspace>
  ): Effect.Effect<IbmWorkspace[], WorkspaceServiceError>
  updateWorkspace(id: string, patch: Partial<IbmWorkspace>): Effect.Effect<IbmWorkspace, WorkspaceServiceError>
  removeWorkspace(id: string): Effect.Effect<void, WorkspaceServiceError>
}

export interface IWorkspaceLookupPort {
  getById(id: string): Effect.Effect<IbmWorkspace | null, WorkspaceServiceError>
}
