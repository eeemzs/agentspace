import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortCodexChatThread } from '../ports/repository-ports/index.js'
import { CodexChatThreadDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryCodexChatThread = createRepositoryFactory<IRepositoryPortCodexChatThread>({
  moduleName: 'RepositoryFactoryCodexChatThread',
  mongoRepo: undefined,
  drizzleRepo: CodexChatThreadDrizzleRepo,
})

