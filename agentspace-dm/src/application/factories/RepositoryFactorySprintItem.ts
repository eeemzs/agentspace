import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortSprintItem } from '../ports/repository-ports/index.js'
import { SprintItemDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactorySprintItem = createRepositoryFactory<IRepositoryPortSprintItem>({
  moduleName: 'RepositoryFactorySprintItem',
  mongoRepo: undefined,
  drizzleRepo: SprintItemDrizzleRepo,
});
