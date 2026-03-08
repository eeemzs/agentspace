import { XfLogger } from '@aopslab/xf-logger'
import { DraBase } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmWorkspaceMember } from '../../../../domain/models/index.js'
import { IRepositoryPortWorkspaceMember } from '../../../../application/ports/repository-ports/index.js'
import { IdbWorkspaceMemberDrizzle, workspaceMemberTable } from '../../../db/workspaceMember/drizzle/drizzle.schema.workspaceMember.js'
import { mapperWorkspaceMemberDrizzle } from '../../../db/workspaceMember/drizzle/drizzle.mapper.workspaceMember.js'

export class WorkspaceMemberDrizzleRepo extends DraBase<IbmWorkspaceMember, IdbWorkspaceMemberDrizzle, typeof workspaceMemberTable> implements IRepositoryPortWorkspaceMember {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(workspaceMemberTable, { mapper: mapperWorkspaceMemberDrizzle, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here.
  //<==//
}
