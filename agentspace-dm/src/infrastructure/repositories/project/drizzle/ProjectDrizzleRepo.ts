import { XfLogger } from '@aopslab/xf-logger'
import { DraBase } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmProject } from '../../../../domain/models/index.js'
import { IRepositoryPortProject } from '../../../../application/ports/repository-ports/index.js'
import { IdbProjectDrizzle, projectTable } from '../../../db/project/drizzle/drizzle.schema.project.js'
import { mapperProjectDrizzle } from '../../../db/project/drizzle/drizzle.mapper.project.js'

export class ProjectDrizzleRepo extends DraBase<IbmProject, IdbProjectDrizzle, typeof projectTable> implements IRepositoryPortProject {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(projectTable, { mapper: mapperProjectDrizzle, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here (example below).
  // findByDummyString(dummyString: string, options?: DbQueryOptions<IbmProject>): Effect.Effect<IbmProject | null, RepositoryError> {
  //   return this.findSingle({ matchEq: { dummyString }, options: options as DbQueryOptions<IdbProjectDrizzle> }).pipe(
  //     Effect.mapError((e): RepositoryError => e)
  //   );
  // }
  //<==//
}

