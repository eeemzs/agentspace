import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortResource } from '../ports/repository-ports/index.js'
import { ResourceDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryResource = createRepositoryFactory<IRepositoryPortResource>({
  moduleName: 'RepositoryFactoryResource',
  mongoRepo: undefined,
  drizzleRepo: ResourceDrizzleRepo,
});
