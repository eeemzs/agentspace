import type { RepositoryError } from '@aopslab/xf-db'
import type { IRepositoryPortBaseCrud } from './IRepositoryPortBaseCrud.js'
import { IbmSkillSetItem } from '../../../domain/models/index.js'
import { IdbSkillSetItemDrizzle } from '../../../infrastructure/db/skillSetItem/drizzle/drizzle.schema.skillSetItem.js'

/**
 * Repository port for SkillSetItem
 *
 * Contract between application layer and infrastructure repositories.
 */
export interface IRepositoryPortSkillSetItem extends IRepositoryPortBaseCrud<IbmSkillSetItem, IdbSkillSetItemDrizzle, RepositoryError> {
  //==> custom-methods
  // Add domain-specific methods here (examples below).
  // Example:
  // findByDummyString(dummyString: string, options?: import('@aopslab/xf-db').DbQueryOptions<IbmSkillSetItem>): import('effect').Effect<IbmSkillSetItem | null, RepositoryError>
  //<==//
}


