import { XfLogger } from '@aopslab/xf-logger'
import { DraBase } from '@aopslab/xf-db-drizzle'
import { RepositoryConfig } from '@aopslab/xf-db'

import { IbmScope } from '../../../../domain/models/index.js'
import { IRepositoryPortScope } from '../../../../application/ports/repository-ports/index.js'
import { IdbScopeDrizzle, scopeTable } from '../../../db/scope/drizzle/drizzle.schema.scope.js'
import { mapperScopeDrizzle } from '../../../db/scope/drizzle/drizzle.mapper.scope.js'

export class ScopeDrizzleRepo extends DraBase<IbmScope, IdbScopeDrizzle, typeof scopeTable> implements IRepositoryPortScope {
  constructor(deps: { repositoryConfig: RepositoryConfig; logger?: XfLogger }) {
    super(scopeTable, { mapper: mapperScopeDrizzle as any, logger: deps.logger, repositoryConfig: deps.repositoryConfig })
  }
}
