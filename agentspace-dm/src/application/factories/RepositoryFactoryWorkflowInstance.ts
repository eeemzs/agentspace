import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortWorkflowInstance } from '../ports/repository-ports/index.js'
import { WorkflowInstanceDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryWorkflowInstance = createRepositoryFactory<IRepositoryPortWorkflowInstance>({
  moduleName: 'RepositoryFactoryWorkflowInstance',
  mongoRepo: undefined,
  drizzleRepo: WorkflowInstanceDrizzleRepo,
})
