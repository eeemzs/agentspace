import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortWorkflowStepRun } from '../ports/repository-ports/index.js'
import { WorkflowStepRunDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryWorkflowStepRun = createRepositoryFactory<IRepositoryPortWorkflowStepRun>({
  moduleName: 'RepositoryFactoryWorkflowStepRun',
  mongoRepo: undefined,
  drizzleRepo: WorkflowStepRunDrizzleRepo,
})
