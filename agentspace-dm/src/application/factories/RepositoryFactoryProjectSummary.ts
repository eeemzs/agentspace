import { IRepositoryPortProjectSummary } from '../ports/repository-ports/index.js'
import { ProjectSummaryDrizzleRepo, ProjectSummaryDrizzleSqliteRepo } from '../../infrastructure/repositories/index.js'
import { createAgentspaceDrizzleRepositoryFactory } from './drizzleDialect.js'

export const RepositoryFactoryProjectSummary = createAgentspaceDrizzleRepositoryFactory<IRepositoryPortProjectSummary>({
  moduleName: 'RepositoryFactoryProjectSummary',
  pgRepo: ProjectSummaryDrizzleRepo,
  sqliteRepo: ProjectSummaryDrizzleSqliteRepo,
})
