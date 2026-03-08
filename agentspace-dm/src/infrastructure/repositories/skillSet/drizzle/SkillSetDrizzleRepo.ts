import { XfLogger } from '@aopslab/xf-logger'
import { DraBase } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmSkillSet } from '../../../../domain/models/index.js'
import { IRepositoryPortSkillSet } from '../../../../application/ports/repository-ports/index.js'
import { IdbSkillSetDrizzle, skillSetTable } from '../../../db/skillSet/drizzle/drizzle.schema.skillSet.js'
import { mapperSkillSetDrizzle } from '../../../db/skillSet/drizzle/drizzle.mapper.skillSet.js'

export class SkillSetDrizzleRepo extends DraBase<IbmSkillSet, IdbSkillSetDrizzle, typeof skillSetTable> implements IRepositoryPortSkillSet {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(skillSetTable, { mapper: mapperSkillSetDrizzle, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here (example below).
  // findByDummyString(dummyString: string, options?: DbQueryOptions<IbmSkillSet>): Effect.Effect<IbmSkillSet | null, RepositoryError> {
  //   return this.findSingle({ matchEq: { dummyString }, options: options as DbQueryOptions<IdbSkillSetDrizzle> }).pipe(
  //     Effect.mapError((e): RepositoryError => e)
  //   );
  // }
  //<==//
}

