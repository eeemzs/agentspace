import type { RepositoryError } from '@aopslab/xf-db'
import type { IRepositoryPortBaseCrud } from './IRepositoryPortBaseCrud.js'
import { IbmProjectSummary } from '../../../domain/models/index.js'
import { IdbProjectSummaryDrizzle } from '../../../infrastructure/db/projectSummary/drizzle/drizzle.schema.projectSummary.js'

/**
 * Repository port for ProjectSummary
 *
 * Contract between application layer and infrastructure repositories.
 */
export interface IRepositoryPortProjectSummary extends IRepositoryPortBaseCrud<IbmProjectSummary, IdbProjectSummaryDrizzle, RepositoryError> {
  //==> custom-methods
  // Add domain-specific methods here (examples below).
  // Example:
  // findByDummyString(dummyString: string, options?: import('@aopslab/xf-db').DbQueryOptions<IbmProjectSummary>): import('effect').Effect<IbmProjectSummary | null, RepositoryError>
  //<==//
}


