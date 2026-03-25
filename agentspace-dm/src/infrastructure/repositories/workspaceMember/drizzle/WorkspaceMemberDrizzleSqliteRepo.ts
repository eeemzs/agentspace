import { XfLogger } from '@aopslab/xf-logger'
import { DraBaseSqlite } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmWorkspaceMember } from '../../../../domain/models/index.js'
import { IRepositoryPortWorkspaceMember } from '../../../../application/ports/repository-ports/index.js'
import { IdbWorkspaceMemberDrizzleSqlite, workspaceMemberTableSqlite } from '../../../db/workspaceMember/drizzle/drizzle.schema.workspaceMember.sqlite.js'
import { mapperWorkspaceMemberDrizzle } from '../../../db/workspaceMember/drizzle/drizzle.mapper.workspaceMember.js'

export class WorkspaceMemberDrizzleSqliteRepo extends DraBaseSqlite<IbmWorkspaceMember, IdbWorkspaceMemberDrizzleSqlite, typeof workspaceMemberTableSqlite> implements IRepositoryPortWorkspaceMember {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(workspaceMemberTableSqlite, { mapper: mapperWorkspaceMemberDrizzle as any, logger: deps.logger, repositoryConfig: deps.repositoryConfig });
  }

  //==> custom-methods
  // Add domain-specific queries here.
  //<==//
}
