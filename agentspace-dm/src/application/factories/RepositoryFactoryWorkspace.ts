import { IRepositoryPortWorkspace } from '../ports/repository-ports/index.js'
import { WorkspaceDrizzleRepo, WorkspaceDrizzleSqliteRepo } from '../../infrastructure/repositories/index.js'
import { createAgentspaceDrizzleRepositoryFactory } from './drizzleDialect.js'

export const RepositoryFactoryWorkspace = createAgentspaceDrizzleRepositoryFactory<IRepositoryPortWorkspace>({
  moduleName: 'RepositoryFactoryWorkspace',
  pgRepo: WorkspaceDrizzleRepo,
  sqliteRepo: WorkspaceDrizzleSqliteRepo,
})
