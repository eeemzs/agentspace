import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortAgentRun } from '../ports/repository-ports/index.js'
import { AgentRunDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryAgentRun = createRepositoryFactory<IRepositoryPortAgentRun>({
  moduleName: 'RepositoryFactoryAgentRun',
  mongoRepo: undefined,
  drizzleRepo: AgentRunDrizzleRepo,
});
