import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortMemoryItem } from '../ports/repository-ports/index.js'
import { MemoryItemDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryMemoryItem = createRepositoryFactory<IRepositoryPortMemoryItem>({
  moduleName: 'RepositoryFactoryMemoryItem',
  mongoRepo: undefined,
  drizzleRepo: MemoryItemDrizzleRepo,
});
