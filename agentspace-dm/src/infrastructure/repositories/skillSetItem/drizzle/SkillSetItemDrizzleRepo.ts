import { XfLogger } from '@aopslab/xf-logger'
import { DraBase } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmSkillSetItem } from '../../../../domain/models/index.js'
import { IRepositoryPortSkillSetItem } from '../../../../application/ports/repository-ports/index.js'
import { IdbSkillSetItemDrizzle, skillSetItemTable } from '../../../db/skillSetItem/drizzle/drizzle.schema.skillSetItem.js'
import { mapperSkillSetItemDrizzle } from '../../../db/skillSetItem/drizzle/drizzle.mapper.skillSetItem.js'

export class SkillSetItemDrizzleRepo extends DraBase<IbmSkillSetItem, IdbSkillSetItemDrizzle, typeof skillSetItemTable> implements IRepositoryPortSkillSetItem {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(skillSetItemTable, { mapper: mapperSkillSetItemDrizzle, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here (example below).
  // findByDummyString(dummyString: string, options?: DbQueryOptions<IbmSkillSetItem>): Effect.Effect<IbmSkillSetItem | null, RepositoryError> {
  //   return this.findSingle({ matchEq: { dummyString }, options: options as DbQueryOptions<IdbSkillSetItemDrizzle> }).pipe(
  //     Effect.mapError((e): RepositoryError => e)
  //   );
  // }
  //<==//
}

