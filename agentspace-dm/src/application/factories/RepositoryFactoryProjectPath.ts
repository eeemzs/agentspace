import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortProjectPath } from '../ports/repository-ports/index.js'
import { ProjectPathDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryProjectPath = createRepositoryFactory<IRepositoryPortProjectPath>({
  moduleName: 'RepositoryFactoryProjectPath',
  mongoRepo: undefined,
  drizzleRepo: ProjectPathDrizzleRepo,
});
