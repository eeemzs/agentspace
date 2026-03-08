import { XfLogger } from '@aopslab/xf-logger'
import { DraBase } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmWorkspace } from '../../../../domain/models/index.js'
import { IRepositoryPortWorkspace } from '../../../../application/ports/repository-ports/index.js'
import { IdbWorkspaceDrizzle, workspaceTable } from '../../../db/workspace/drizzle/drizzle.schema.workspace.js'
import { mapperWorkspaceDrizzle } from '../../../db/workspace/drizzle/drizzle.mapper.workspace.js'

export class WorkspaceDrizzleRepo extends DraBase<IbmWorkspace, IdbWorkspaceDrizzle, typeof workspaceTable> implements IRepositoryPortWorkspace {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(workspaceTable, { mapper: mapperWorkspaceDrizzle, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here (example below).
  // findByDummyString(dummyString: string, options?: DbQueryOptions<IbmWorkspace>): Effect.Effect<IbmWorkspace | null, RepositoryError> {
  //   return this.findSingle({ matchEq: { dummyString }, options: options as DbQueryOptions<IdbWorkspaceDrizzle> }).pipe(
  //     Effect.mapError((e): RepositoryError => e)
  //   );
  // }
  //<==//
}
