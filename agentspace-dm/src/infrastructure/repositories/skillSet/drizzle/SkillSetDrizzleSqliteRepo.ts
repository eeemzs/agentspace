import { XfLogger } from '@aopslab/xf-logger'
import { DraBaseSqlite } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmSkillSet } from '../../../../domain/models/index.js'
import { IRepositoryPortSkillSet } from '../../../../application/ports/repository-ports/index.js'
import { IdbSkillSetDrizzleSqlite, skillSetTableSqlite } from '../../../db/skillSet/drizzle/drizzle.schema.skillSet.sqlite.js'
import { mapperSkillSetDrizzle } from '../../../db/skillSet/drizzle/drizzle.mapper.skillSet.js'

export class SkillSetDrizzleSqliteRepo extends DraBaseSqlite<IbmSkillSet, IdbSkillSetDrizzleSqlite, typeof skillSetTableSqlite> implements IRepositoryPortSkillSet {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(skillSetTableSqlite, { mapper: mapperSkillSetDrizzle as any, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here (example below).
  // findByDummyString(dummyString: string, options?: DbQueryOptions<IbmSkillSet>): Effect.Effect<IbmSkillSet | null, RepositoryError> {
  //   return this.findSingle({ matchEq: { dummyString }, options: options as DbQueryOptions<IdbSkillSetDrizzleSqlite> }).pipe(
  //     Effect.mapError((e): RepositoryError => e)
  //   );
  // }
  //<==//
}
