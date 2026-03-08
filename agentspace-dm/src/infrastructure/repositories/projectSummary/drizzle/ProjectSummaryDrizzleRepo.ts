import { XfLogger } from '@aopslab/xf-logger'
import { DraBase } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmProjectSummary } from '../../../../domain/models/index.js'
import { IRepositoryPortProjectSummary } from '../../../../application/ports/repository-ports/index.js'
import { IdbProjectSummaryDrizzle, projectSummaryTable } from '../../../db/projectSummary/drizzle/drizzle.schema.projectSummary.js'
import { mapperProjectSummaryDrizzle } from '../../../db/projectSummary/drizzle/drizzle.mapper.projectSummary.js'

export class ProjectSummaryDrizzleRepo extends DraBase<IbmProjectSummary, IdbProjectSummaryDrizzle, typeof projectSummaryTable> implements IRepositoryPortProjectSummary {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(projectSummaryTable, { mapper: mapperProjectSummaryDrizzle, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here (example below).
  // findByDummyString(dummyString: string, options?: DbQueryOptions<IbmProjectSummary>): Effect.Effect<IbmProjectSummary | null, RepositoryError> {
  //   return this.findSingle({ matchEq: { dummyString }, options: options as DbQueryOptions<IdbProjectSummaryDrizzle> }).pipe(
  //     Effect.mapError((e): RepositoryError => e)
  //   );
  // }
  //<==//
}

