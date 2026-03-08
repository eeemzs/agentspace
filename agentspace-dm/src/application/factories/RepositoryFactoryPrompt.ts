import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortPrompt } from '../ports/repository-ports/index.js'
import { PromptDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryPrompt = createRepositoryFactory<IRepositoryPortPrompt>({
  moduleName: 'RepositoryFactoryPrompt',
  mongoRepo: undefined,
  drizzleRepo: PromptDrizzleRepo,
});
