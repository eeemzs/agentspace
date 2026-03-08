import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortPromptVersion } from '../ports/repository-ports/index.js'
import { PromptVersionDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryPromptVersion = createRepositoryFactory<IRepositoryPortPromptVersion>({
  moduleName: 'RepositoryFactoryPromptVersion',
  mongoRepo: undefined,
  drizzleRepo: PromptVersionDrizzleRepo,
});
