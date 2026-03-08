import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortSprint } from '../ports/repository-ports/index.js'
import { SprintDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactorySprint = createRepositoryFactory<IRepositoryPortSprint>({
  moduleName: 'RepositoryFactorySprint',
  mongoRepo: undefined,
  drizzleRepo: SprintDrizzleRepo,
});
