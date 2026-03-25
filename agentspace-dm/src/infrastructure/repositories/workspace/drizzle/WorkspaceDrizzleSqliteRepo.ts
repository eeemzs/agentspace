import { XfLogger } from '@aopslab/xf-logger'
import { DraBaseSqlite } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmWorkspace } from '../../../../domain/models/index.js'
import { IRepositoryPortWorkspace } from '../../../../application/ports/repository-ports/index.js'
import { IdbWorkspaceDrizzleSqlite, workspaceTableSqlite } from '../../../db/workspace/drizzle/drizzle.schema.workspace.sqlite.js'
import { mapperWorkspaceDrizzle } from '../../../db/workspace/drizzle/drizzle.mapper.workspace.js'

export class WorkspaceDrizzleSqliteRepo extends DraBaseSqlite<IbmWorkspace, IdbWorkspaceDrizzleSqlite, typeof workspaceTableSqlite> implements IRepositoryPortWorkspace {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(workspaceTableSqlite, { mapper: mapperWorkspaceDrizzle as any, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here (example below).
  // findByDummyString(dummyString: string, options?: DbQueryOptions<IbmWorkspace>): Effect.Effect<IbmWorkspace | null, RepositoryError> {
  //   return this.findSingle({ matchEq: { dummyString }, options: options as DbQueryOptions<IdbWorkspaceDrizzleSqlite> }).pipe(
  //     Effect.mapError((e): RepositoryError => e)
  //   );
  // }
  //<==//
}
