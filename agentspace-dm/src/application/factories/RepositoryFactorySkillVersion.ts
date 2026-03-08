import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortSkillVersion } from '../ports/repository-ports/index.js'
import { SkillVersionDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactorySkillVersion = createRepositoryFactory<IRepositoryPortSkillVersion>({
  moduleName: 'RepositoryFactorySkillVersion',
  mongoRepo: undefined,
  drizzleRepo: SkillVersionDrizzleRepo,
});
