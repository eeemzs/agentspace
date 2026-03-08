import type { RepositoryError } from '@aopslab/xf-db'
import type { IRepositoryPortBaseCrud } from './IRepositoryPortBaseCrud.js'
import { IbmWorkspace } from '../../../domain/models/index.js'
import { IdbWorkspaceDrizzle } from '../../../infrastructure/db/workspace/drizzle/drizzle.schema.workspace.js'

/**
 * Repository port for Workspace
 *
 * Contract between application layer and infrastructure repositories.
 */
export interface IRepositoryPortWorkspace extends IRepositoryPortBaseCrud<IbmWorkspace, IdbWorkspaceDrizzle, RepositoryError> {
  //==> custom-methods
  // Add domain-specific methods here (examples below).
  // Example:
  // findByDummyString(dummyString: string, options?: import('@aopslab/xf-db').DbQueryOptions<IbmWorkspace>): import('effect').Effect<IbmWorkspace | null, RepositoryError>
  //<==//
}

