import { IRepositoryPortWorkspaceMember } from '../ports/repository-ports/index.js'
import { WorkspaceMemberDrizzleRepo, WorkspaceMemberDrizzleSqliteRepo } from '../../infrastructure/repositories/index.js'
import { createAgentspaceDrizzleRepositoryFactory } from './drizzleDialect.js'

export const RepositoryFactoryWorkspaceMember = createAgentspaceDrizzleRepositoryFactory<IRepositoryPortWorkspaceMember>({
  moduleName: 'RepositoryFactoryWorkspaceMember',
  pgRepo: WorkspaceMemberDrizzleRepo,
  sqliteRepo: WorkspaceMemberDrizzleSqliteRepo,
})
