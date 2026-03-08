import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortSkillSetItem } from '../ports/repository-ports/index.js'
import { SkillSetItemDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactorySkillSetItem = createRepositoryFactory<IRepositoryPortSkillSetItem>({
  moduleName: 'RepositoryFactorySkillSetItem',
  mongoRepo: undefined,
  drizzleRepo: SkillSetItemDrizzleRepo,
});
