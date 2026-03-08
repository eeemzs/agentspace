import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortTag } from '../ports/repository-ports/index.js'
import { TagDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryTag = createRepositoryFactory<IRepositoryPortTag>({
  moduleName: 'RepositoryFactoryTag',
  mongoRepo: undefined,
  drizzleRepo: TagDrizzleRepo,
});
