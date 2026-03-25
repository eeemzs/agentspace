import { IRepositoryPortSkillSet } from '../ports/repository-ports/index.js'
import { SkillSetDrizzleRepo, SkillSetDrizzleSqliteRepo } from '../../infrastructure/repositories/index.js'
import { createAgentspaceDrizzleRepositoryFactory } from './drizzleDialect.js'

export const RepositoryFactorySkillSet = createAgentspaceDrizzleRepositoryFactory<IRepositoryPortSkillSet>({
  moduleName: 'RepositoryFactorySkillSet',
  pgRepo: SkillSetDrizzleRepo,
  sqliteRepo: SkillSetDrizzleSqliteRepo,
})
