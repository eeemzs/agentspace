import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortAgentRunEvent } from '../ports/repository-ports/index.js'
import { AgentRunEventDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryAgentRunEvent = createRepositoryFactory<IRepositoryPortAgentRunEvent>({
  moduleName: 'RepositoryFactoryAgentRunEvent',
  mongoRepo: undefined,
  drizzleRepo: AgentRunEventDrizzleRepo,
})
