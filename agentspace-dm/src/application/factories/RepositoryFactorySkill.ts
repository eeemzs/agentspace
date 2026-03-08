import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortSkill } from '../ports/repository-ports/index.js'
import { SkillDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactorySkill = createRepositoryFactory<IRepositoryPortSkill>({
  moduleName: 'RepositoryFactorySkill',
  mongoRepo: undefined,
  drizzleRepo: SkillDrizzleRepo,
});
