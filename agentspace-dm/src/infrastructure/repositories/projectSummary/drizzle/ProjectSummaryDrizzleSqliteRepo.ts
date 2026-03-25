import { XfLogger } from '@aopslab/xf-logger'
import { DraBaseSqlite } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmProjectSummary } from '../../../../domain/models/index.js'
import { IRepositoryPortProjectSummary } from '../../../../application/ports/repository-ports/index.js'
import { IdbProjectSummaryDrizzleSqlite, projectSummaryTableSqlite } from '../../../db/projectSummary/drizzle/drizzle.schema.projectSummary.sqlite.js'
import { mapperProjectSummaryDrizzle } from '../../../db/projectSummary/drizzle/drizzle.mapper.projectSummary.js'

export class ProjectSummaryDrizzleSqliteRepo extends DraBaseSqlite<IbmProjectSummary, IdbProjectSummaryDrizzleSqlite, typeof projectSummaryTableSqlite> implements IRepositoryPortProjectSummary {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(projectSummaryTableSqlite, { mapper: mapperProjectSummaryDrizzle as any, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here (example below).
  // findByDummyString(dummyString: string, options?: DbQueryOptions<IbmProjectSummary>): Effect.Effect<IbmProjectSummary | null, RepositoryError> {
  //   return this.findSingle({ matchEq: { dummyString }, options: options as DbQueryOptions<IdbProjectSummaryDrizzleSqlite> }).pipe(
  //     Effect.mapError((e): RepositoryError => e)
  //   );
  // }
  //<==//
}
