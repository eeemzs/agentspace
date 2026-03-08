import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortWorkspace } from '../ports/repository-ports/index.js'
import { WorkspaceDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryWorkspace = createRepositoryFactory<IRepositoryPortWorkspace>({
  moduleName: 'RepositoryFactoryWorkspace',
  mongoRepo: undefined,
  drizzleRepo: WorkspaceDrizzleRepo,
});
