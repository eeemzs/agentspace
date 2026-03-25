import { XfLogger } from '@aopslab/xf-logger'
import { DraBaseSqlite } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmProject } from '../../../../domain/models/index.js'
import { IRepositoryPortProject } from '../../../../application/ports/repository-ports/index.js'
import { IdbProjectDrizzleSqlite, projectTableSqlite } from '../../../db/project/drizzle/drizzle.schema.project.sqlite.js'
import { mapperProjectDrizzle } from '../../../db/project/drizzle/drizzle.mapper.project.js'

export class ProjectDrizzleSqliteRepo extends DraBaseSqlite<IbmProject, IdbProjectDrizzleSqlite, typeof projectTableSqlite> implements IRepositoryPortProject {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(projectTableSqlite, { mapper: mapperProjectDrizzle as any, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here (example below).
  // findByDummyString(dummyString: string, options?: DbQueryOptions<IbmProject>): Effect.Effect<IbmProject | null, RepositoryError> {
  //   return this.findSingle({ matchEq: { dummyString }, options: options as DbQueryOptions<IdbProjectDrizzleSqlite> }).pipe(
  //     Effect.mapError((e): RepositoryError => e)
  //   );
  // }
  //<==//
}
