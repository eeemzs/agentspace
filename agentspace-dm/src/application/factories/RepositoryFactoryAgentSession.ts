import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortAgentSession } from '../ports/repository-ports/index.js'
import { AgentSessionDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryAgentSession = createRepositoryFactory<IRepositoryPortAgentSession>({
  moduleName: 'RepositoryFactoryAgentSession',
  mongoRepo: undefined,
  drizzleRepo: AgentSessionDrizzleRepo,
});
