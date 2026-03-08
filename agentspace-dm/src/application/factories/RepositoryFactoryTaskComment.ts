import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortTaskComment } from '../ports/repository-ports/index.js'
import { TaskCommentDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryTaskComment = createRepositoryFactory<IRepositoryPortTaskComment>({
  moduleName: 'RepositoryFactoryTaskComment',
  mongoRepo: undefined,
  drizzleRepo: TaskCommentDrizzleRepo,
});
