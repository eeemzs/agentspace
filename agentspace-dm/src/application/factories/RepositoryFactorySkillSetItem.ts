import { IRepositoryPortSkillSetItem } from '../ports/repository-ports/index.js'
import { SkillSetItemDrizzleRepo, SkillSetItemDrizzleSqliteRepo } from '../../infrastructure/repositories/index.js'
import { createAgentspaceDrizzleRepositoryFactory } from './drizzleDialect.js'

export const RepositoryFactorySkillSetItem = createAgentspaceDrizzleRepositoryFactory<IRepositoryPortSkillSetItem>({
  moduleName: 'RepositoryFactorySkillSetItem',
  pgRepo: SkillSetItemDrizzleRepo,
  sqliteRepo: SkillSetItemDrizzleSqliteRepo,
})
