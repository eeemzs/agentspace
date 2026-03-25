import { XfLogger } from '@aopslab/xf-logger'
import { DraBaseSqlite } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmSkillSetItem } from '../../../../domain/models/index.js'
import { IRepositoryPortSkillSetItem } from '../../../../application/ports/repository-ports/index.js'
import { IdbSkillSetItemDrizzleSqlite, skillSetItemTableSqlite } from '../../../db/skillSetItem/drizzle/drizzle.schema.skillSetItem.sqlite.js'
import { mapperSkillSetItemDrizzle } from '../../../db/skillSetItem/drizzle/drizzle.mapper.skillSetItem.js'

export class SkillSetItemDrizzleSqliteRepo extends DraBaseSqlite<IbmSkillSetItem, IdbSkillSetItemDrizzleSqlite, typeof skillSetItemTableSqlite> implements IRepositoryPortSkillSetItem {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(skillSetItemTableSqlite, { mapper: mapperSkillSetItemDrizzle as any, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here (example below).
  // findByDummyString(dummyString: string, options?: DbQueryOptions<IbmSkillSetItem>): Effect.Effect<IbmSkillSetItem | null, RepositoryError> {
  //   return this.findSingle({ matchEq: { dummyString }, options: options as DbQueryOptions<IdbSkillSetItemDrizzleSqlite> }).pipe(
  //     Effect.mapError((e): RepositoryError => e)
  //   );
  // }
  //<==//
}
