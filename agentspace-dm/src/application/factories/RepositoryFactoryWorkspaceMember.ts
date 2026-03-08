import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortWorkspaceMember } from '../ports/repository-ports/index.js'
import { WorkspaceMemberDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryWorkspaceMember = createRepositoryFactory<IRepositoryPortWorkspaceMember>({
  moduleName: 'RepositoryFactoryWorkspaceMember',
  mongoRepo: undefined,
  drizzleRepo: WorkspaceMemberDrizzleRepo,
});
