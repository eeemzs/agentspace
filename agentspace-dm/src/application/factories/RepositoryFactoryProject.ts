import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortProject } from '../ports/repository-ports/index.js'
import { ProjectDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryProject = createRepositoryFactory<IRepositoryPortProject>({
  moduleName: 'RepositoryFactoryProject',
  mongoRepo: undefined,
  drizzleRepo: ProjectDrizzleRepo,
});
