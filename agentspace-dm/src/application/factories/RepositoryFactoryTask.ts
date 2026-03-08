import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortTask } from '../ports/repository-ports/index.js'
import { TaskDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryTask = createRepositoryFactory<IRepositoryPortTask>({
  moduleName: 'RepositoryFactoryTask',
  mongoRepo: undefined,
  drizzleRepo: TaskDrizzleRepo,
});
