import type { RepositoryError } from '@aopslab/xf-db'
import type { IRepositoryPortBaseCrud } from './IRepositoryPortBaseCrud.js'
import { IbmSkillSet } from '../../../domain/models/index.js'
import { IdbSkillSetDrizzle } from '../../../infrastructure/db/skillSet/drizzle/drizzle.schema.skillSet.js'

/**
 * Repository port for SkillSet
 *
 * Contract between application layer and infrastructure repositories.
 */
export interface IRepositoryPortSkillSet extends IRepositoryPortBaseCrud<IbmSkillSet, IdbSkillSetDrizzle, RepositoryError> {
  //==> custom-methods
  // Add domain-specific methods here (examples below).
  // Example:
  // findByDummyString(dummyString: string, options?: import('@aopslab/xf-db').DbQueryOptions<IbmSkillSet>): import('effect').Effect<IbmSkillSet | null, RepositoryError>
  //<==//
}


