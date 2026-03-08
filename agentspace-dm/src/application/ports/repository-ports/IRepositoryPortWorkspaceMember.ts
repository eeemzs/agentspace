import type { RepositoryError } from '@aopslab/xf-db'
import type { IRepositoryPortBaseCrud } from './IRepositoryPortBaseCrud.js'
import { IbmWorkspaceMember } from '../../../domain/models/index.js'
import { IdbWorkspaceMemberDrizzle } from '../../../infrastructure/db/workspaceMember/drizzle/drizzle.schema.workspaceMember.js'

/**
 * Repository port for WorkspaceMember
 *
 * Contract between application layer and infrastructure repositories.
 */
export interface IRepositoryPortWorkspaceMember extends IRepositoryPortBaseCrud<IbmWorkspaceMember, IdbWorkspaceMemberDrizzle, RepositoryError> {
  //==> custom-methods
  // Add domain-specific methods here (examples below).
  // Example:
  // findByDummyString(dummyString: string, options?: import('@aopslab/xf-db').DbQueryOptions<IbmWorkspaceMember>): import('effect').Effect<IbmWorkspaceMember | null, RepositoryError>
  //<==//
}

