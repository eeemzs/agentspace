import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortCodexChatMessage } from '../ports/repository-ports/index.js'
import { CodexChatMessageDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryCodexChatMessage = createRepositoryFactory<IRepositoryPortCodexChatMessage>({
  moduleName: 'RepositoryFactoryCodexChatMessage',
  mongoRepo: undefined,
  drizzleRepo: CodexChatMessageDrizzleRepo,
})

