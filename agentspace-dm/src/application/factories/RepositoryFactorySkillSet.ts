import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortSkillSet } from '../ports/repository-ports/index.js'
import { SkillSetDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactorySkillSet = createRepositoryFactory<IRepositoryPortSkillSet>({
  moduleName: 'RepositoryFactorySkillSet',
  mongoRepo: undefined,
  drizzleRepo: SkillSetDrizzleRepo,
});
