import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortProjectMember } from '../ports/repository-ports/index.js'
import { ProjectMemberDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryProjectMember = createRepositoryFactory<IRepositoryPortProjectMember>({
  moduleName: 'RepositoryFactoryProjectMember',
  mongoRepo: undefined,
  drizzleRepo: ProjectMemberDrizzleRepo,
});
