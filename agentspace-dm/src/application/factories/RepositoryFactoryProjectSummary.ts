import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortProjectSummary } from '../ports/repository-ports/index.js'
import { ProjectSummaryDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryProjectSummary = createRepositoryFactory<IRepositoryPortProjectSummary>({
  moduleName: 'RepositoryFactoryProjectSummary',
  mongoRepo: undefined,
  drizzleRepo: ProjectSummaryDrizzleRepo,
});
