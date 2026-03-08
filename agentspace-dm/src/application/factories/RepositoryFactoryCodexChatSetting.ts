import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortCodexChatSetting } from '../ports/repository-ports/index.js'
import { CodexChatSettingDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryCodexChatSetting = createRepositoryFactory<IRepositoryPortCodexChatSetting>({
  moduleName: 'RepositoryFactoryCodexChatSetting',
  mongoRepo: undefined,
  drizzleRepo: CodexChatSettingDrizzleRepo,
})

