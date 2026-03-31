import { XfLogger } from '@aopslab/xf-logger'
import { DraBaseSqlite } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmScope } from '../../../../domain/models/index.js'
import { IRepositoryPortScope } from '../../../../application/ports/repository-ports/index.js'
import { IdbScopeDrizzleSqlite, scopeTableSqlite } from '../../../db/scope/drizzle/drizzle.schema.scope.sqlite.js'
import { mapperScopeDrizzle } from '../../../db/scope/drizzle/drizzle.mapper.scope.js'

export class ScopeDrizzleSqliteRepo extends DraBaseSqlite<IbmScope, IdbScopeDrizzleSqlite, typeof scopeTableSqlite> implements IRepositoryPortScope {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(scopeTableSqlite, { mapper: mapperScopeDrizzle as any, logger: deps.logger, repositoryConfig: deps.repositoryConfig })
  }
}
